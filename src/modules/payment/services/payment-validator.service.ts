import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentStatus } from 'generated/prisma/client';

/**
 * Service responsible for payment validations
 * Follows Single Responsibility Principle (SRP) and KISS
 */
@Injectable()
export class PaymentValidatorService {
  /**
   * Validates that payment can be refunded
   */
  validateRefundable(payment: any): void {
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }
  }

  /**
   * Validates refund amount
   */
  validateRefundAmount(
    amountToRefund: number,
    alreadyRefunded: number,
    totalAmount: number,
  ): void {
    if (amountToRefund <= 0) {
      throw new BadRequestException('Invalid refund amount');
    }

    if (alreadyRefunded + amountToRefund > totalAmount) {
      throw new BadRequestException(
        `Cannot refund more than the payment amount. Already refunded: ${alreadyRefunded}, Total: ${totalAmount}`,
      );
    }
  }

  /**
   * Validates payment intent exists
   */
  validatePaymentIntent(paymentIntentId: string | null | undefined): void {
    if (!paymentIntentId) {
      throw new BadRequestException('No payment intent found for this payment');
    }
  }

  /**
   * Validates payment is not already completed
   */
  validateNotCompleted(payment: any): void {
    if (payment && payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed for this order');
    }
  }
}
