import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PaymentService, CashPayment, CashPaymentRequest } from '../services/payment.service';

@Controller('api/v1/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('cash/initiate')
  initiateCashPayment(@Body() request: CashPaymentRequest): CashPayment {
    try {
      return this.paymentService.initiateCashPayment(request);
    } catch (error) {
      throw new HttpException(
        `Failed to initiate cash payment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cash/driver-confirm')
  confirmByDriver(
    @Body() body: { paymentId: string; notes?: string },
  ): CashPayment | null {
    try {
      return this.paymentService.confirmCashPaymentByDriver(
        body.paymentId,
        body.notes,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to confirm payment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('cash/rider-confirm')
  confirmByRider(
    @Body() body: { paymentId: string; notes?: string },
  ): CashPayment | null {
    try {
      return this.paymentService.confirmCashPaymentByRider(
        body.paymentId,
        body.notes,
      );
    } catch (error) {
      throw new HttpException(
        `Failed to confirm payment: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cash/:paymentId')
  getPayment(@Param('paymentId') paymentId: string): CashPayment | null {
    return this.paymentService.getPaymentById(paymentId);
  }

  @Get('cash/order/:orderId')
  getPaymentByOrder(@Param('orderId') orderId: string): CashPayment | null {
    return this.paymentService.getPaymentByOrderId(orderId);
  }

  @Get('cash/rider/:riderId')
  getRiderPayments(@Param('riderId') riderId: string): CashPayment[] {
    return this.paymentService.getPaymentsByRider(riderId);
  }

  @Get('cash/driver/:driverId')
  getDriverPayments(@Param('driverId') driverId: string): CashPayment[] {
    return this.paymentService.getPaymentsByDriver(driverId);
  }

  @Get('cash/pending')
  getPendingConfirmations(): CashPayment[] {
    return this.paymentService.getPendingConfirmations();
  }

  @Get('cash/driver/:driverId/pending')
  getDriverPendingConfirmations(
    @Param('driverId') driverId: string,
  ): CashPayment[] {
    return this.paymentService.getPendingConfirmationForDriver(driverId);
  }

  @Post('cash/:paymentId/cancel')
  cancelPayment(@Param('paymentId') paymentId: string): CashPayment | null {
    return this.paymentService.cancelPayment(paymentId);
  }

  @Post('cash/:paymentId/refund')
  refundPayment(
    @Param('paymentId') paymentId: string,
    @Body() body: { reason: string },
  ): CashPayment | null {
    return this.paymentService.refundPayment(paymentId, body.reason);
  }

  @Get('cash/driver/:driverId/stats')
  getDriverStats(@Param('driverId') driverId: string) {
    return this.paymentService.getPaymentStats(driverId);
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'healthy',
      service: 'payment-service',
    };
  }
}
