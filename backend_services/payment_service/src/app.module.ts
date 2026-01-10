import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './controllers/payment.controller';
import { StripePaymentsController } from './controllers/stripe.controller';
import { PaymentService } from './services/payment.service';
import { StripeService } from './services/stripe.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [PaymentController, StripePaymentsController],
  providers: [PaymentService, StripeService],
  exports: [PaymentService, StripeService],
})
export class AppModule {}
