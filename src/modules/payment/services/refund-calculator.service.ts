import { Injectable } from '@nestjs/common';
import { PaymentStatus } from 'generated/prisma/client';

/**
 * Refund calculation result
 */
export interface RefundCalculation {
  amountToRefund: number;
  totalRefunded: number;
  isFullyRefunded: boolean;
  newStatus: PaymentStatus;
}

/**
 * Service responsible for refund calculations
 * Follows Single Responsibility Principle (SRP) and KISS
 */
@Injectable()
export class RefundCalculatorService {
  /**
   * Calculates refund amounts and determines new payment status
   */
  calculateRefund(
    requestedAmount: number | undefined,
    totalAmount: number,
    alreadyRefunded: number,
  ): RefundCalculation {
    const amountToRefund = this.determineRefundAmount(
      requestedAmount,
      totalAmount,
      alreadyRefunded,
    );

    const totalRefunded = alreadyRefunded + amountToRefund;
    const isFullyRefunded = this.isFullRefund(totalRefunded, totalAmount);

    return {
      amountToRefund,
      totalRefunded,
      isFullyRefunded,
      newStatus: this.determineNewStatus(isFullyRefunded),
    };
  }

  /**
   * Converts amount to cents for Stripe API
   */
  toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Determines the amount to refund
   */
  private determineRefundAmount(
    requestedAmount: number | undefined,
    totalAmount: number,
    alreadyRefunded: number,
  ): number {
    // If no amount specified, refund remaining amount
    return requestedAmount ?? (totalAmount - alreadyRefunded);
  }

  /**
   * Checks if this is a full refund
   */
  private isFullRefund(totalRefunded: number, totalAmount: number): boolean {
    return totalRefunded >= totalAmount;
  }

  /**
   * Determines new payment status after refund
   */
  private determineNewStatus(isFullyRefunded: boolean): PaymentStatus {
    return isFullyRefunded ? PaymentStatus.REFUNDED : PaymentStatus.COMPLETED;
  }

  /**
   * Creates refund success message
   */
  createSuccessMessage(isFullyRefunded: boolean): string {
    return isFullyRefunded
      ? 'Full refund processed successfully'
      : 'Partial refund processed successfully';
  }
}
