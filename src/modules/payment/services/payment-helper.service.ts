import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IPaymentRepository } from '../repositories/payment.repository.interface';
import { IOrderRepository } from '../../orders/repositories/order.repository.interface';
import { PAYMENT_REPOSITORY } from '../payment.constants';
import { ORDER_REPOSITORY } from '../../orders/orders.constants';
import { StripeService } from '../stripe.service';

/**
 * Helper service for common payment operations
 * Follows DRY principle by centralizing reusable logic
 */
@Injectable()
export class PaymentHelperService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly stripeService: StripeService,
  ) {}

  /**
   * Finds order by user ID and order ID or throws error
   */
  async findOrderOrFail(userId: string, orderId: string): Promise<any> {
    const order = await this.orderRepository.findByUserIdAndId(userId, orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  /**
   * Finds payment by order ID or throws error
   */
  async findPaymentOrFail(orderId: string): Promise<any> {
    const payment = await this.paymentRepository.findByOrderId(orderId);

    if (!payment) {
      throw new NotFoundException('Payment not found for this order');
    }

    return payment;
  }

  /**
   * Gets payment intent ID from payment record
   * Retrieves from session if not directly available
   */
  async getPaymentIntentId(payment: any): Promise<string | null> {
    if (payment.providerPaymentId) {
      return payment.providerPaymentId;
    }

    if (payment.transactionId) {
      const session = await this.stripeService.retrieveSession(
        payment.transactionId,
      );
      return session.payment_intent as string;
    }

    return null;
  }

  /**
   * Generates idempotency key for payment
   */
  generateIdempotencyKey(orderId: string): string {
    return `order_${orderId}_${Date.now()}`;
  }

  /**
   * Creates payment metadata
   */
  createPaymentMetadata(sessionId: string, sessionUrl: string | null): any {
    return {
      sessionId,
      sessionUrl,
    };
  }

  /**
   * Builds refund metadata entry
   */
  buildRefundMetadata(refundId: string, amount: number, reason?: string): any {
    return {
      refundId,
      amount,
      reason,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Updates payment metadata with refund information
   */
  async updatePaymentRefundMetadata(
    payment: any,
    refundId: string,
    amount: number,
    reason?: string,
  ): Promise<void> {
    const metadata = payment.metadata || {};
    const existingRefunds = metadata.refunds || [];
    const newRefund = this.buildRefundMetadata(refundId, amount, reason);

    await this.paymentRepository.update(payment.id, {
      metadata: {
        ...metadata,
        refunds: [...existingRefunds, newRefund],
      },
    });
  }
}
