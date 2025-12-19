import { Inject, Injectable } from '@nestjs/common';
import { CreateCheckoutSessionDto } from './dto/payment.dto';
import { PAYMENT_REPOSITORY } from './payment.constants';
import { IPaymentRepository } from './repositories/payment.repository.interface';
import { StripeService } from './stripe.service';
import { ORDER_REPOSITORY } from '../orders/orders.constants';
import { IOrderRepository } from '../orders/repositories/order.repository.interface';
import { PaymentMethod, PaymentStatus, OrderStatus } from 'generated/prisma/client';
import Stripe from 'stripe';
import { LineItemBuilderService } from './services/line-item-builder.service';
import { PaymentValidatorService } from './services/payment-validator.service';
import { PaymentWebhookHandlerService } from './services/payment-webhook-handler.service';
import { RefundCalculatorService } from './services/refund-calculator.service';
import { PaymentHelperService } from './services/payment-helper.service';

/**
 * Main Payment Service - Orchestrates payment operations
 * Refactored to follow SOLID, DRY, and KISS principles
 */
@Injectable()
export class PaymentService {
  private readonly CURRENCY = 'USD';

  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly stripeService: StripeService,
    private readonly lineItemBuilder: LineItemBuilderService,
    private readonly validator: PaymentValidatorService,
    private readonly webhookHandler: PaymentWebhookHandlerService,
    private readonly refundCalculator: RefundCalculatorService,
    private readonly helper: PaymentHelperService,
  ) {}

  /**
   * Creates a Stripe checkout session for an order
   */
  async createCheckoutSession(
    userId: string,
    dto: CreateCheckoutSessionDto,
  ) {
    const order = await this.helper.findOrderOrFail(userId, dto.orderId);
    const existingPayment = await this.paymentRepository.findByOrderId(order.id);

    this.validator.validateNotCompleted(existingPayment);

    const session = await this.createStripeSession(order, dto);

    await this.saveOrUpdatePayment(existingPayment, order, session, dto.ipAddress);

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Handles incoming Stripe webhook events
   */
  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.webhookHandler.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'checkout.session.expired':
        await this.webhookHandler.handleCheckoutSessionExpired(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'payment_intent.payment_failed':
        await this.webhookHandler.handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Retrieves payment details for an order
   */
  async getPaymentByOrderId(orderId: string, userId: string) {
    await this.helper.findOrderOrFail(userId, orderId);
    return this.helper.findPaymentOrFail(orderId);
  }

  /**
   * Processes a full or partial refund
   */
  async refundPayment(
    orderId: string,
    userId: string,
    refundAmount?: number,
    reason?: string,
  ) {
    await this.helper.findOrderOrFail(userId, orderId);
    const payment = await this.helper.findPaymentOrFail(orderId);

    this.validator.validateRefundable(payment);

    const calculation = this.calculateRefundDetails(payment, refundAmount);

    this.validator.validateRefundAmount(
      calculation.amountToRefund,
      Number(payment.refundedAmount || 0),
      Number(payment.amount),
    );

    const paymentIntentId = await this.getValidPaymentIntentId(payment);

    const refund = await this.processStripeRefund(
      paymentIntentId,
      calculation.amountToRefund,
      reason,
    );

    await this.updatePaymentAfterRefund(payment, calculation, refund.id, reason);

    if (calculation.isFullyRefunded) {
      await this.orderRepository.updateStatus(orderId, OrderStatus.REFUNDED);
    }

    return {
      message: this.refundCalculator.createSuccessMessage(calculation.isFullyRefunded),
      refundedAmount: calculation.amountToRefund,
      totalRefunded: calculation.totalRefunded,
      refundId: refund.id,
    };
  }

  // ========== Private Helper Methods ==========

  /**
   * Creates Stripe checkout session
   */
  private async createStripeSession(order: any, dto: CreateCheckoutSessionDto) {
    const lineItems = this.lineItemBuilder.buildLineItems(order);

    return this.stripeService.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Math.round(Number(order.total) * 100),
      currency: this.CURRENCY.toLowerCase(),
      customerEmail: order.user.email,
      lineItems,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });
  }

  /**
   * Saves new payment or updates existing one
   */
  private async saveOrUpdatePayment(
    existingPayment: any,
    order: any,
    session: Stripe.Checkout.Session,
    ipAddress?: string,
  ): Promise<void> {
    const metadata = this.helper.createPaymentMetadata(session.id, session.url);

    if (existingPayment) {
      await this.updateExistingPayment(existingPayment, session, metadata, ipAddress);
    } else {
      await this.createNewPayment(order, session, metadata, ipAddress);
    }
  }

  /**
   * Updates existing payment record
   */
  private async updateExistingPayment(
    payment: any,
    session: Stripe.Checkout.Session,
    metadata: any,
    ipAddress?: string,
  ): Promise<void> {
    await this.paymentRepository.update(payment.id, {
      transactionId: session.id,
      providerPaymentId: (session.payment_intent as string) || null,
      status: PaymentStatus.PENDING,
      currency: this.CURRENCY,
      ipAddress,
      metadata,
    });
  }

  /**
   * Creates new payment record
   */
  private async createNewPayment(
    order: any,
    session: Stripe.Checkout.Session,
    metadata: any,
    ipAddress?: string,
  ): Promise<void> {
    await this.paymentRepository.create({
      order: { connect: { id: order.id } },
      amount: order.total,
      currency: this.CURRENCY,
      method: PaymentMethod.STRIPE,
      status: PaymentStatus.PENDING,
      transactionId: session.id,
      providerPaymentId: (session.payment_intent as string) || null,
      idempotencyKey: this.helper.generateIdempotencyKey(order.id),
      ipAddress,
      metadata,
    });
  }

  /**
   * Calculates refund details
   */
  private calculateRefundDetails(payment: any, requestedAmount?: number) {
    return this.refundCalculator.calculateRefund(
      requestedAmount,
      Number(payment.amount),
      Number(payment.refundedAmount || 0),
    );
  }

  /**
   * Gets payment intent ID or throws error
   */
  private async getValidPaymentIntentId(payment: any): Promise<string> {
    const paymentIntentId = await this.helper.getPaymentIntentId(payment);
    this.validator.validatePaymentIntent(paymentIntentId);
    return paymentIntentId!;
  }

  /**
   * Processes refund with Stripe
   */
  private async processStripeRefund(
    paymentIntentId: string,
    amount: number,
    reason?: string,
  ) {
    return this.stripeService.refundPayment(
      paymentIntentId,
      this.refundCalculator.toCents(amount),
      reason,
    );
  }

  /**
   * Updates payment record after refund
   */
  private async updatePaymentAfterRefund(
    payment: any,
    calculation: any,
    refundId: string,
    reason?: string,
  ): Promise<void> {
    // Update refund amounts and status
    await this.paymentRepository.updateRefund(
      payment.id,
      calculation.totalRefunded,
      calculation.newStatus,
    );

    // Update metadata with refund history
    await this.helper.updatePaymentRefundMetadata(
      payment,
      refundId,
      calculation.amountToRefund,
      reason,
    );
  }
}
