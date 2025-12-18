import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCheckoutSessionDto } from './dto/payment.dto';
import { PAYMENT_REPOSITORY } from './payment.constants';
import { IPaymentRepository } from './repositories/payment.repository.interface';
import { StripeService } from './stripe.service';
import { ORDER_REPOSITORY } from '../orders/orders.constants';
import { IOrderRepository } from '../orders/repositories/order.repository.interface';
import { PaymentMethod, PaymentStatus, OrderStatus } from 'generated/prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  constructor(
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: IPaymentRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    private readonly stripeService: StripeService,
  ) {}

  async createCheckoutSession(
    userId: string,
    createCheckoutSessionDto: CreateCheckoutSessionDto,
  ) {
    // Validate order exists and belongs to user
    const order = await this.orderRepository.findByUserIdAndId(
      userId,
      createCheckoutSessionDto.orderId,
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if payment already exists for this order
    const existingPayment = await this.paymentRepository.findByOrderId(order.id);
    if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment already completed for this order');
    }

    // Cast order to include relations
    const orderWithItems = order as any;

    // Prepare line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = orderWithItems.items.map(
      (item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            description: item.product.description || undefined,
            images: item.product.images?.length > 0
              ? [item.product.images[0].url]
              : undefined,
          },
          unit_amount: Math.round(Number(item.price) * 100), // Convert to cents
        },
        quantity: item.quantity,
      }),
    );

    // Add shipping cost as line item if > 0
    if (Number(order.shippingCost) > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping',
          },
          unit_amount: Math.round(Number(order.shippingCost) * 100),
        },
        quantity: 1,
      });
    }

    // Add tax as line item if > 0
    if (Number(order.tax) > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
          },
          unit_amount: Math.round(Number(order.tax) * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await this.stripeService.createCheckoutSession({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: Math.round(Number(order.total) * 100),
      currency: 'usd',
      customerEmail: orderWithItems.user.email,
      lineItems,
      successUrl: createCheckoutSessionDto.successUrl,
      cancelUrl: createCheckoutSessionDto.cancelUrl,
    });

    // Generate idempotency key for payment
    const idempotencyKey = `order_${order.id}_${Date.now()}`;

    // Create or update payment record
    if (existingPayment) {
      await this.paymentRepository.update(existingPayment.id, {
        transactionId: session.id,
        providerPaymentId: session.payment_intent as string || null,
        status: PaymentStatus.PENDING,
        currency: 'USD',
        ipAddress: createCheckoutSessionDto.ipAddress,
        metadata: { sessionUrl: session.url, sessionId: session.id },
      });
    } else {
      await this.paymentRepository.create({
        order: { connect: { id: order.id } },
        amount: order.total,
        currency: 'USD',
        method: PaymentMethod.STRIPE,
        status: PaymentStatus.PENDING,
        transactionId: session.id,
        providerPaymentId: session.payment_intent as string || null,
        idempotencyKey,
        ipAddress: createCheckoutSessionDto.ipAddress,
        metadata: { sessionUrl: session.url, sessionId: session.id },
      });
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  async handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'checkout.session.expired':
        await this.handleCheckoutSessionExpired(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'payment_intent.succeeded':
        // Additional confirmation that payment succeeded
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const payment = await this.paymentRepository.findByTransactionId(session.id);

    if (!payment) {
      throw new NotFoundException('Payment not found for this session');
    }

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

  private async handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
    const payment = await this.paymentRepository.findByTransactionId(session.id);

    if (payment) {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
      });
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    // Find payment by payment intent ID
    const payment = await this.paymentRepository.findByProviderPaymentId(
      paymentIntent.id,
    );

    if (payment) {
      await this.paymentRepository.update(payment.id, {
        status: PaymentStatus.FAILED,
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      });
    }
  }

  async getPaymentByOrderId(orderId: string, userId: string) {
    const order = await this.orderRepository.findByUserIdAndId(userId, orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const payment = await this.paymentRepository.findByOrderId(orderId);

    if (!payment) {
      throw new NotFoundException('Payment not found for this order');
    }

    return payment;
  }

  async refundPayment(
    orderId: string,
    userId: string,
    refundAmount?: number,
    reason?: string,
  ) {
    const order = await this.orderRepository.findByUserIdAndId(userId, orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const payment = await this.paymentRepository.findByOrderId(orderId);

    if (!payment) {
      throw new NotFoundException('Payment not found for this order');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const totalAmount = Number(payment.amount);
    const alreadyRefunded = Number(payment.refundedAmount || 0);
    const amountToRefund = refundAmount || (totalAmount - alreadyRefunded);

    // Validate refund amount
    if (amountToRefund <= 0) {
      throw new BadRequestException('Invalid refund amount');
    }

    if (alreadyRefunded + amountToRefund > totalAmount) {
      throw new BadRequestException(
        `Cannot refund more than the payment amount. Already refunded: ${alreadyRefunded}, Total: ${totalAmount}`,
      );
    }

    // Get payment intent ID
    let paymentIntentId = payment.providerPaymentId;

    if (!paymentIntentId && payment.transactionId) {
      // Retrieve the session to get the payment intent
      const session = await this.stripeService.retrieveSession(payment.transactionId);
      paymentIntentId = session.payment_intent as string;
    }

    if (!paymentIntentId) {
      throw new BadRequestException('No payment intent found for this payment');
    }

    // Create refund with Stripe
    const refund = await this.stripeService.refundPayment(
      paymentIntentId,
      Math.round(amountToRefund * 100), // Convert to cents
      reason,
    );

    const totalRefunded = alreadyRefunded + amountToRefund;
    const isFullyRefunded = totalRefunded >= totalAmount;

    // Update payment with refund information
    await this.paymentRepository.updateRefund(
      payment.id,
      totalRefunded,
      isFullyRefunded ? PaymentStatus.REFUNDED : PaymentStatus.COMPLETED,
    );

    // Update payment metadata with refund details
    await this.paymentRepository.update(payment.id, {
      metadata: {
        ...(payment.metadata as any),
        refunds: [
          ...((payment.metadata as any)?.refunds || []),
          {
            refundId: refund.id,
            amount: amountToRefund,
            reason,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    // Update order status if fully refunded
    if (isFullyRefunded) {
      await this.orderRepository.updateStatus(orderId, OrderStatus.REFUNDED);
    }

    return {
      message: isFullyRefunded
        ? 'Full refund processed successfully'
        : 'Partial refund processed successfully',
      refundedAmount: amountToRefund,
      totalRefunded,
      refundId: refund.id,
    };
  }
}
