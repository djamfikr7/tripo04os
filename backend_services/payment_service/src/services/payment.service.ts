import { Injectable, NotFoundException } from '@nestjs/common';

export interface CashPayment {
  paymentId: string;
  orderId: string;
  riderId: string;
  driverId: string;
  amount: number;
  currency: string;
  status: 'initiated' | 'driver_confirmed' | 'rider_confirmed' | 'completed' | 'cancelled' | 'refunded';
  driverConfirmed: boolean;
  riderConfirmed: boolean;
  driverConfirmationTime?: Date;
  riderConfirmationTime?: Date;
  driverNotes?: string;
  riderNotes?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashPaymentRequest {
  orderId: string;
  riderId: string;
  driverId: string;
  amount: number;
  currency?: string;
}

@Injectable()
export class PaymentService {
  // In-memory storage for demonstration (would use a database in production)
  private payments: Map<string, CashPayment> = new Map();

  constructor() {
    // Initialize with some sample data
    this.initSampleData();
  }

  private initSampleData() {
    const now = new Date();
    const samplePayment: CashPayment = {
      paymentId: 'cash_pay_sample_001',
      orderId: 'order_123',
      riderId: 'rider_001',
      driverId: 'driver_001',
      amount: 2500,
      currency: 'USD',
      status: 'initiated',
      driverConfirmed: false,
      riderConfirmed: false,
      createdAt: now,
      updatedAt: now,
    };
    this.payments.set(samplePayment.paymentId, samplePayment);
  }

  /**
   * Initiate a cash payment
   */
  initiateCashPayment(request: CashPaymentRequest): CashPayment {
    const paymentId = `cash_pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const payment: CashPayment = {
      paymentId,
      orderId: request.orderId,
      riderId: request.riderId,
      driverId: request.driverId,
      amount: request.amount,
      currency: request.currency || 'USD',
      status: 'initiated',
      driverConfirmed: false,
      riderConfirmed: false,
      createdAt: now,
      updatedAt: now,
    };

    this.payments.set(paymentId, payment);
    return payment;
  }

  /**
   * Confirm cash payment by driver
   */
  confirmCashPaymentByDriver(paymentId: string, notes?: string): CashPayment | null {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment not found: ${paymentId}`);
    }

    if (payment.status === 'cancelled' || payment.status === 'refunded') {
      throw new Error(`Cannot confirm cancelled or refunded payment`);
    }

    payment.driverConfirmed = true;
    payment.driverConfirmationTime = new Date();
    payment.driverNotes = notes;
    payment.status = 'driver_confirmed';
    payment.updatedAt = new Date();

    // If both confirmed, mark as completed
    if (payment.riderConfirmed) {
      payment.status = 'completed';
      payment.completedAt = new Date();
    }

    this.payments.set(paymentId, payment);
    return payment;
  }

  /**
   * Confirm cash payment by rider
   */
  confirmCashPaymentByRider(paymentId: string, notes?: string): CashPayment | null {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment not found: ${paymentId}`);
    }

    if (payment.status === 'cancelled' || payment.status === 'refunded') {
      throw new Error(`Cannot confirm cancelled or refunded payment`);
    }

    payment.riderConfirmed = true;
    payment.riderConfirmationTime = new Date();
    payment.riderNotes = notes;
    payment.status = 'rider_confirmed';
    payment.updatedAt = new Date();

    // If both confirmed, mark as completed
    if (payment.driverConfirmed) {
      payment.status = 'completed';
      payment.completedAt = new Date();
    }

    this.payments.set(paymentId, payment);
    return payment;
  }

  /**
   * Get payment by ID
   */
  getPaymentById(paymentId: string): CashPayment | null {
    return this.payments.get(paymentId) || null;
  }

  /**
   * Get payment by order ID
   */
  getPaymentByOrderId(orderId: string): CashPayment | null {
    for (const payment of this.payments.values()) {
      if (payment.orderId === orderId) {
        return payment;
      }
    }
    return null;
  }

  /**
   * Get all payments for a rider
   */
  getPaymentsByRider(riderId: string): CashPayment[] {
    const payments: CashPayment[] = [];
    for (const payment of this.payments.values()) {
      if (payment.riderId === riderId) {
        payments.push(payment);
      }
    }
    return payments;
  }

  /**
   * Get all payments for a driver
   */
  getPaymentsByDriver(driverId: string): CashPayment[] {
    const payments: CashPayment[] = [];
    for (const payment of this.payments.values()) {
      if (payment.driverId === driverId) {
        payments.push(payment);
      }
    }
    return payments;
  }

  /**
   * Get all pending confirmations
   */
  getPendingConfirmations(): CashPayment[] {
    const payments: CashPayment[] = [];
    for (const payment of this.payments.values()) {
      if (payment.status === 'driver_confirmed' || payment.status === 'rider_confirmed') {
        payments.push(payment);
      }
    }
    return payments;
  }

  /**
   * Get pending confirmations for a specific driver
   */
  getPendingConfirmationForDriver(driverId: string): CashPayment[] {
    const payments: CashPayment[] = [];
    for (const payment of this.payments.values()) {
      if (payment.driverId === driverId && (payment.status === 'initiated' || payment.status === 'rider_confirmed')) {
        payments.push(payment);
      }
    }
    return payments;
  }

  /**
   * Cancel a payment
   */
  cancelPayment(paymentId: string): CashPayment | null {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment not found: ${paymentId}`);
    }

    if (payment.status === 'completed' || payment.status === 'refunded') {
      throw new Error(`Cannot cancel completed or refunded payment`);
    }

    payment.status = 'cancelled';
    payment.cancelledAt = new Date();
    payment.updatedAt = new Date();

    this.payments.set(paymentId, payment);
    return payment;
  }

  /**
   * Refund a payment
   */
  refundPayment(paymentId: string, reason: string): CashPayment | null {
    const payment = this.payments.get(paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment not found: ${paymentId}`);
    }

    if (payment.status === 'cancelled' || payment.status === 'refunded') {
      throw new Error(`Cannot refund cancelled or refunded payment`);
    }

    payment.status = 'refunded';
    payment.refundReason = reason;
    payment.updatedAt = new Date();

    this.payments.set(paymentId, payment);
    return payment;
  }

  /**
   * Get payment statistics for a driver
   */
  getPaymentStats(driverId: string) {
    const payments = this.getPaymentsByDriver(driverId);

    const totalEarned = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = payments
      .filter(p => p.status === 'driver_confirmed' || p.status === 'rider_confirmed')
      .reduce((sum, p) => sum + p.amount, 0);

    const completedCount = payments.filter(p => p.status === 'completed').length;
    const pendingCount = payments.filter(p => p.status === 'driver_confirmed' || p.status === 'rider_confirmed').length;

    return {
      totalEarned,
      pendingAmount,
      completedCount,
      pendingCount,
      averageEarnings: completedCount > 0 ? totalEarned / completedCount : 0,
    };
  }
}
