import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { IPaymentRepository } from '../repositories/payment.repository.interface';
import { IOrderRepository } from '../../orders/repositories/order.repository.interface';
import { PAYMENT_REPOSITORY } from '../payment.constants';
import { ORDER_REPOSITORY } from '../../orders/orders.constants';
import { PaymentStatus, OrderStatus } from 'generated/prisma/client';

/**
 * Service responsible for handling Stripe webhook events
 * Follows Single Responsibility Principle (SRP)
 */
@Injectable()
export class PaymentWebhookHandlerService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
  ) {}

  /**
   * Handles checkout session completed event
   */
  async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const payment = await this.findPaymentBySession(session.id);

    // Update payment status with paidAt timestamp
    await this.paymentRepository.updateStatus(
      payment.id,
      PaymentStatus.COMPLETED,
      new Date(),
    );

    // Update payment with provider payment ID if available
    if (session.payment_intent) {
      await this.paymentRepository.update(payment.id, {
        providerPaymentId: session.payment_intent as string,
      });
    }

    // Update order status to processing
    await this.orderRepository.updateStatus(
      payment.orderId,
      OrderStatus.PROCESSING,
    );
  }

  /**
   * Handles checkout session expired event
   */
  async handleCheckoutSessionExpired(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const payment = await this.paymentRepository.findByTransactionId(
      session.id,
    );

    if (payment) {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
      });
    }
  }

  /**
   * Handles payment intent failed event
   */
  async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    const payment = await this.paymentRepository.findByProviderPaymentId(
      paymentIntent.id,
    );

    if (payment) {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
        failureReason: this.extractFailureReason(paymentIntent),
      });
    }
  }

  /**
   * Finds payment by session ID or throws error
   */
  private async findPaymentBySession(sessionId: string): Promise<any> {
    const payment = await this.paymentRepository.findByTransactionId(sessionId);

    if (!payment) {
      throw new NotFoundException('Payment not found for this session');
    }

    return payment;
  }

  /**
   * Extracts failure reason from payment intent
   */
  private extractFailureReason(paymentIntent: Stripe.PaymentIntent): string {
    return paymentIntent.last_payment_error?.message || 'Payment failed';
  }
}
