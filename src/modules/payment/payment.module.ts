import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { StripeService } from './stripe.service';
import { PAYMENT_REPOSITORY } from './payment.constants';
import { PaymentRepository } from './repositories/payment.repository';
import { OrdersModule } from '../orders/orders.module';
import { LineItemBuilderService } from './services/line-item-builder.service';
import { PaymentValidatorService } from './services/payment-validator.service';
import { PaymentWebhookHandlerService } from './services/payment-webhook-handler.service';
import { RefundCalculatorService } from './services/refund-calculator.service';
import { PaymentHelperService } from './services/payment-helper.service';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    StripeService,
    LineItemBuilderService,
    PaymentValidatorService,
    PaymentWebhookHandlerService,
    RefundCalculatorService,
    PaymentHelperService,
    {
      provide: PAYMENT_REPOSITORY,
      useClass: PaymentRepository,
    },
  ],
  exports: [PaymentService, StripeService],
})
export class PaymentModule {}
