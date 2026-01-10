import { Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2024-11-20.acacia' as any,
      typescript: true,
    });

    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  /**
   * Create a payment intent for a given amount and currency
   */
  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    paymentMethodTypes: string[];
    orderId?: string;
    customerEmail?: string;
    customerId?: string;
    metadata?: Record<string, any>;
  }) {
    const { amount, currency, paymentMethodTypes, orderId, customerEmail, customerId, metadata } = data;

    const intentParams: Stripe.PaymentIntentCreateParams = {
      amount,
      currency,
      payment_method_types: paymentMethodTypes,
      metadata: {
        orderId: orderId || '',
        ...metadata,
      },
    };

    // Attach customer if provided
    if (customerId) {
      intentParams.customer = customerId;
    }

    // Create payment intent
    const paymentIntent = await this.stripe.paymentIntents.create(intentParams);

    // Create or retrieve customer if email provided but no customerId
    if (customerEmail && !customerId) {
      const customer = await this.getOrCreateCustomer(customerEmail);
      await this.stripe.paymentIntents.update(paymentIntent.id, { customer: customer.id });
    }

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      next_action: paymentIntent.next_action,
      created_at: new Date(paymentIntent.created * 1000).toISOString(),
    };
  }

  /**
   * Confirm a payment intent with a payment method
   */
  async confirmPayment(data: { paymentIntentId: string; paymentMethodId: string }) {
    const paymentIntent = await this.stripe.paymentIntents.confirm(data.paymentIntentId, {
      payment_method: data.paymentMethodId,
    });

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      next_action: paymentIntent.next_action,
      client_secret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created_at: new Date(paymentIntent.created * 1000).toISOString(),
    };
  }

  /**
   * Cancel a payment intent
   */
  async cancelPaymentIntent(paymentIntentId: string) {
    await this.stripe.paymentIntents.cancel(paymentIntentId);
  }

  /**
   * Create a payment method for a customer
   */
  async createPaymentMethod(data: {
    type: 'card' | 'us_bank_account';
    token?: string;
    billingDetails?: {
      email?: string;
      name?: string;
      address?: Record<string, any>;
    };
  }) {
    const paymentMethod = await this.stripe.paymentMethods.create({
      type: data.type,
      [data.type]: data.token ? { token: data.token } : undefined,
      billing_details: data.billingDetails,
    });

    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      is_default: false,
      created_at: new Date(paymentMethod.created * 1000).toISOString(),
      updated_at: new Date(paymentMethod.created * 1000).toISOString(),
    };
  }

  /**
   * Get payment methods for a customer
   */
  async getPaymentMethods(customerId: string) {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    const customer = await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
    const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method as string;

    return paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      is_default: pm.id === defaultPaymentMethodId,
      last_4: (pm.card as any)?.last4 || '',
      brand: (pm.card as any)?.brand || '',
      expiry_month: (pm.card as any)?.exp_month || 0,
      expiry_year: (pm.card as any)?.exp_year || 0,
      billing_details: pm.billing_details,
      created_at: new Date(pm.created * 1000).toISOString(),
      updated_at: new Date(pm.created * 1000).toISOString(),
    }));
  }

  /**
   * Set default payment method for a customer
   */
  async setDefaultPaymentMethod(customerId: string, paymentMethodId: string) {
    const customer = await this.stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      is_default: true,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(customerId: string, paymentMethodId: string) {
    await this.stripe.paymentMethods.detach(paymentMethodId);
  }

  /**
   * Get or create a customer by email
   */
  async getOrCreateCustomer(email: string, name?: string) {
    const existingCustomers = await this.stripe.customers.list({
      email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0];
    }

    return await this.stripe.customers.create({
      email,
      name,
    });
  }

  /**
   * Get customer by Stripe customer ID
   */
  async getCustomerId(stripeCustomerId: string) {
    const customer = await this.stripe.customers.retrieve(stripeCustomerId);

    if (customer.deleted) {
      throw new NotFoundException('Customer not found');
    }

    return {
      customer_id: (customer as Stripe.Customer).id,
      email: (customer as Stripe.Customer).email,
      name: (customer as Stripe.Customer).name,
    };
  }

  /**
   * Process Stripe webhook events
   */
  async processWebhook(event: any) {
    const sig = event.headers['stripe-signature'];

    if (this.webhookSecret && sig) {
      try {
        const verifiedEvent = this.stripe.webhooks.constructEvent(
          event.body,
          sig,
          this.webhookSecret,
        );

        // Handle different event types
        switch (verifiedEvent.type) {
          case 'payment_intent.succeeded':
            await this.handlePaymentSucceeded(verifiedEvent.data.object as Stripe.PaymentIntent);
            break;
          case 'payment_intent.payment_failed':
            await this.handlePaymentFailed(verifiedEvent.data.object as Stripe.PaymentIntent);
            break;
          case 'customer.subscription.created':
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
            await this.handleSubscriptionEvent(verifiedEvent);
            break;
          default:
            console.log(`Unhandled event type: ${verifiedEvent.type}`);
        }
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        throw err;
      }
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    console.log(`Payment succeeded: ${paymentIntent.id}`);

    // TODO: Update order status, send notifications, etc.
    // This would typically involve calling other services
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log(`Payment failed: ${paymentIntent.id}`);

    // TODO: Update order status, send notifications, etc.
    // This would typically involve calling other services
  }

  /**
   * Handle subscription events
   */
  private async handleSubscriptionEvent(event: Stripe.Event) {
    console.log(`Subscription event: ${event.type}`);

    // TODO: Handle subscription lifecycle events
    // This would typically involve updating subscription service
  }

  /**
   * Create a refund for a payment intent
   */
  async createRefund(paymentIntentId: string, amount?: number, reason?: string) {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount,
      reason: reason as Stripe.RefundCreateParams.Reason || undefined,
    });

    return {
      id: refund.id,
      amount: refund.amount,
      status: refund.status,
      created_at: new Date(refund.created * 1000).toISOString(),
    };
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      created_at: new Date(paymentIntent.created * 1000).toISOString(),
    };
  }
}
