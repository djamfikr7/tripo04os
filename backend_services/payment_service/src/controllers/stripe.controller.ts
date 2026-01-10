import { Controller, Post, Get, Delete, Patch, Param, Body, HttpException, HttpStatus, Header, HttpCode } from '@nestjs/common';
import { ApiTags } from '../common/api-tags.decorator';
import { StripeService } from '../services/stripe.service';

/**
 * DTO for Stripe payment intent creation
 */
export class CreatePaymentIntentDto {
  amount: number;
  currency: string;
  paymentMethodTypes: string[];
  paymentMethodType: string;
  orderId?: string;
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

/**
 * DTO for payment intent confirmation
 */
export class ConfirmPaymentIntentDto {
  id: string;
  status: 'succeeded' | 'requires_payment_method' | 'requires_action' | 'requires_confirmation' | 'canceled' | 'processing';
}

/**
 * DTO for payment method creation
 */
export class CreatePaymentMethodDto {
  type: 'card' | 'us_bank_account';
  isDefault: boolean;
  billingDetails?: {
    email?: string;
    name?: string;
    address?: Record<string, any>;
  };
}

/**
 * Payment intent response
 */
export class PaymentIntentResponseDto {
  id: string;
  clientSecret: string;
  publishableKey: string;
  status: string;
  amount: number;
  currency: string;
  nextAction: string;
  createdAt: string;
}

/**
 * Payment confirmation request
 */
export class ConfirmPaymentDto {
  paymentIntentId: string;
  paymentMethodId: string;
}

@ApiTags('payment')
@Controller('api/v1/payments')
export class StripePaymentsController {
  constructor(private readonly stripeService: StripeService) {}

  /**
   * Create a Stripe payment intent
   * @param request Payment intent details
   * @returns Created payment intent with client secret
   */
  @Post('create-intent')
  async createIntent(@Body() request: CreatePaymentIntentDto): Promise<PaymentIntentResponseDto> {
    try {
      const paymentIntent = await this.stripeService.createPaymentIntent(request);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        publishableKey: paymentIntent.publishableKey,
        status: 'requires_payment_method' as any,
        amount: request.amount,
        currency: request.currency,
        nextAction: paymentIntent.next_action as any,
        createdAt: paymentIntent.created_at,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create payment intent: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Confirm a payment with selected payment method
   * @param confirmationRequest Payment method selection
   * @returns Confirmed payment intent or processing status
   */
  @Post('confirm')
  async confirmPayment(@Body() request: ConfirmPaymentDto): Promise<ConfirmPaymentIntentDto> {
    try {
      const confirmedIntent = await this.stripeService.confirmPayment(request);

      return {
        id: confirmedIntent.id,
        status: confirmedIntent.status as any,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to confirm payment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Cancel a payment intent
   * @param paymentIntentId Payment intent ID
   */
  @Delete('stripe/:paymentIntentId')
  async cancelPaymentIntent(@Param('paymentIntentId') paymentIntentId: string): Promise<{ message: string }> {
    try {
      await this.stripeService.cancelPaymentIntent(paymentIntentId);

      return { message: 'Payment canceled successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to cancel payment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a payment method (card or bank account)
   * @param paymentMethod Payment method details
   * @returns Created payment method
   */
  @Post('payment-methods')
  async createPaymentMethod(@Body() request: CreatePaymentMethodDto): Promise<any> {
    try {
      const paymentMethod = await this.stripeService.createPaymentMethod(request);

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        is_default: paymentMethod.is_default,
        created_at: paymentMethod.created_at,
        updated_at: paymentMethod.updated_at,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to create payment method: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get payment methods for a customer
   * @param customerId Customer ID
   @returns List of payment methods
   */
  @Get('customers/:customerId/payment-methods')
  async getPaymentMethods(@Param('customerId') customerId: string): Promise<any[]> {
    try {
      const methods = await this.stripeService.getPaymentMethods(customerId);

      return methods.map(method => ({
        id: method.id,
        type: method.type,
        isDefault: method.is_default,
        last4: method.last_4,
        brand: method.brand || '',
        expiryMonth: method.expiry_month || 0,
        expiryYear: method.expiry_year || 0,
        name: method.billing_details?.name || '',
      }));
    } catch (error) {
      throw new HttpException(
        `Failed to get payment methods: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update payment method (set as default)
   * @param customerId Customer ID
   * @param paymentMethodId Payment method ID
   */
  @Patch('customers/:customerId/payment-methods/:paymentMethodId/default')
  async setDefaultPaymentMethod(
    @Param('customerId') customerId: string,
    @Param('paymentMethodId') paymentMethodId: string,
  ): Promise<any> {
    try {
      const updatedMethod = await this.stripeService.setDefaultPaymentMethod(customerId, paymentMethodId);

      return {
        id: updatedMethod.id,
        type: updatedMethod.type,
        is_default: updatedMethod.is_default,
        updated_at: updatedMethod.updated_at,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to set default payment method: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete payment method
   * @param customerId Customer ID
   * @param paymentMethodId Payment method ID
   */
  @Delete('customers/:customerId/payment-methods/:paymentMethodId')
  async deletePaymentMethod(
    @Param('customerId') customerId: string,
    @Param('paymentMethodId') paymentMethodId: string,
  ): Promise<{ message: string }> {
    try {
      await this.stripeService.deletePaymentMethod(customerId, paymentMethodId);

      return { message: 'Payment method deleted successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to delete payment method: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Process webhook event from Stripe
   * @param event Stripe webhook payload
   * @returns Success confirmation
   */
  @Post('webhooks/stripe')
  async handleWebhook(@Body() event: any): Promise<{ message: string }> {
    try {
      await this.stripeService.processWebhook(event);

      return { message: 'Webhook processed successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to process webhook: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get customer ID from Stripe
   * @param stripeCustomerId Stripe customer ID
   * @returns Customer ID
   */
  @Get('customers/stripe/:stripeCustomerId/customer-id')
  async getCustomerId(@Param('stripeCustomerId') stripeCustomerId: string): Promise<{ customerId: string }> {
    try {
      const customer = await this.stripeService.getCustomerId(stripeCustomerId);

      return {
        customerId: customer.customer_id,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get customer ID: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check
   */
  @Get('health')
  async healthCheck(): Promise<{ status: string }> {
    return { status: 'healthy' };
  }
}
