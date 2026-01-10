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

export class ConfirmPaymentIntentDto {
  id: string;
  status: 'succeeded' | 'requires_payment_method' | 'requires_action' | 'requires_confirmation' | 'canceled' | 'processing';
}

export class CreatePaymentMethodDto {
  type: 'card' | 'us_bank_account';
  token?: string;
  isDefault: boolean;
  billingDetails?: {
    email?: string;
    name?: string;
    address?: Record<string, any>;
  };
}

export class PaymentIntentResponseDto {
  id: string;
  clientSecret: string;
  publishableKey: string;
  status: string;
  amount: number;
  currency: string;
  nextAction?: any;
  createdAt: string;
}

export class ConfirmPaymentDto {
  paymentIntentId: string;
  paymentMethodId: string;
}

export class CashPaymentRequest {
  orderId: string;
  riderId: string;
  driverId: string;
  amount: number;
  currency?: string;
}
