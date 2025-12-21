import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentWebhookHandlerService } from './payment-webhook-handler.service';
import { IPaymentRepository } from '../repositories/payment.repository.interface';
import { IOrderRepository } from '../../orders/repositories/order.repository.interface';
import { PAYMENT_REPOSITORY } from '../payment.constants';
import { ORDER_REPOSITORY } from '../../orders/orders.constants';
import { PaymentStatus, OrderStatus } from 'generated/prisma/client';
import {
  mockCompletedPayment,
  mockPendingPayment,
  mockStripeSession,
  mockStripeSessionExpired,
  mockStripePaymentIntentFailed,
  mockOrderId,
  mockSessionId,
  mockPaymentIntentId,
} from '../../../../test/fixtures/payment.fixture';

describe('PaymentWebhookHandlerService', () => {
  let service: PaymentWebhookHandlerService;
  let paymentRepository: jest.Mocked<IPaymentRepository>;
  let orderRepository: jest.Mocked<IOrderRepository>;

  beforeEach(async () => {
    const mockPaymentRepository = {
      findByTransactionId: jest.fn(),
      findByProviderPaymentId: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockOrderRepository = {
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentWebhookHandlerService,
        { provide: PAYMENT_REPOSITORY, useValue: mockPaymentRepository },
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
      ],
    }).compile();

    service = module.get<PaymentWebhookHandlerService>(
      PaymentWebhookHandlerService,
    );
    paymentRepository = module.get(PAYMENT_REPOSITORY);
    orderRepository = module.get(ORDER_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleCheckoutSessionCompleted', () => {
    it('should update payment and order status when session completed', async () => {
      paymentRepository.findByTransactionId.mockResolvedValue(
        mockPendingPayment as any,
      );
      paymentRepository.updateStatus.mockResolvedValue(
        mockCompletedPayment as any,
      );
      paymentRepository.update.mockResolvedValue(mockCompletedPayment as any);
      orderRepository.updateStatus.mockResolvedValue({} as any);

      await service.handleCheckoutSessionCompleted(mockStripeSession as any);

      expect(paymentRepository.findByTransactionId).toHaveBeenCalledWith(
        mockSessionId,
      );
      expect(paymentRepository.updateStatus).toHaveBeenCalledWith(
        mockPendingPayment.id,
        PaymentStatus.COMPLETED,
        expect.any(Date),
      );
      expect(paymentRepository.update).toHaveBeenCalledWith(
        mockPendingPayment.id,
        {
          providerPaymentId: mockPaymentIntentId,
        },
      );
      expect(orderRepository.updateStatus).toHaveBeenCalledWith(
        mockOrderId,
        OrderStatus.PROCESSING,
      );
    });

    it('should update payment without provider payment ID when not available', async () => {
      const sessionWithoutIntent = {
        ...mockStripeSession,
        payment_intent: null,
      };

      paymentRepository.findByTransactionId.mockResolvedValue(
        mockPendingPayment as any,
      );
      paymentRepository.updateStatus.mockResolvedValue(
        mockCompletedPayment as any,
      );
      orderRepository.updateStatus.mockResolvedValue({} as any);

      await service.handleCheckoutSessionCompleted(sessionWithoutIntent as any);

      expect(paymentRepository.updateStatus).toHaveBeenCalledWith(
        mockPendingPayment.id,
        PaymentStatus.COMPLETED,
        expect.any(Date),
      );
      expect(paymentRepository.update).not.toHaveBeenCalled();
      expect(orderRepository.updateStatus).toHaveBeenCalledWith(
        mockOrderId,
        OrderStatus.PROCESSING,
      );
    });

    it('should throw NotFoundException when payment not found', async () => {
      paymentRepository.findByTransactionId.mockResolvedValue(null);

      await expect(
        service.handleCheckoutSessionCompleted(mockStripeSession as any),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.handleCheckoutSessionCompleted(mockStripeSession as any),
      ).rejects.toThrow('Payment not found for this session');

      expect(paymentRepository.updateStatus).not.toHaveBeenCalled();
      expect(paymentRepository.update).not.toHaveBeenCalled();
      expect(orderRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('handleCheckoutSessionExpired', () => {
    it('should update payment status to failed when session expired', async () => {
      paymentRepository.findByTransactionId.mockResolvedValue(
        mockPendingPayment as any,
      );
      paymentRepository.update.mockResolvedValue({
        ...mockPendingPayment,
        status: PaymentStatus.FAILED,
      } as any);

      await service.handleCheckoutSessionExpired(
        mockStripeSessionExpired as any,
      );

      expect(paymentRepository.findByTransactionId).toHaveBeenCalledWith(
        mockSessionId,
      );
      expect(paymentRepository.update).toHaveBeenCalledWith(
        mockPendingPayment.id,
        {
          status: PaymentStatus.FAILED,
        },
      );
    });

    it('should not update when payment not found', async () => {
      paymentRepository.findByTransactionId.mockResolvedValue(null);

      await service.handleCheckoutSessionExpired(
        mockStripeSessionExpired as any,
      );

      expect(paymentRepository.findByTransactionId).toHaveBeenCalledWith(
        mockSessionId,
      );
      expect(paymentRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentFailed', () => {
    it('should update payment status and failure reason when payment failed', async () => {
      paymentRepository.findByProviderPaymentId.mockResolvedValue(
        mockPendingPayment as any,
      );
      paymentRepository.update.mockResolvedValue({
        ...mockPendingPayment,
        status: PaymentStatus.FAILED,
        failureReason: 'Your card was declined',
      } as any);

      await service.handlePaymentFailed(mockStripePaymentIntentFailed as any);

      expect(paymentRepository.findByProviderPaymentId).toHaveBeenCalledWith(
        mockPaymentIntentId,
      );
      expect(paymentRepository.update).toHaveBeenCalledWith(
        mockPendingPayment.id,
        {
          status: PaymentStatus.FAILED,
          failureReason: 'Your card was declined',
        },
      );
    });

    it('should use default failure reason when error message not available', async () => {
      const paymentIntentWithoutError = {
        ...mockStripePaymentIntentFailed,
        last_payment_error: null,
      };

      paymentRepository.findByProviderPaymentId.mockResolvedValue(
        mockPendingPayment as any,
      );
      paymentRepository.update.mockResolvedValue({
        ...mockPendingPayment,
        status: PaymentStatus.FAILED,
      } as any);

      await service.handlePaymentFailed(paymentIntentWithoutError as any);

      expect(paymentRepository.update).toHaveBeenCalledWith(
        mockPendingPayment.id,
        {
          status: PaymentStatus.FAILED,
          failureReason: 'Payment failed',
        },
      );
    });

    it('should not update when payment not found', async () => {
      paymentRepository.findByProviderPaymentId.mockResolvedValue(null);

      await service.handlePaymentFailed(mockStripePaymentIntentFailed as any);

      expect(paymentRepository.findByProviderPaymentId).toHaveBeenCalledWith(
        mockPaymentIntentId,
      );
      expect(paymentRepository.update).not.toHaveBeenCalled();
    });

    it('should handle payment intent with undefined last_payment_error', async () => {
      const paymentIntentUndefinedError = {
        ...mockStripePaymentIntentFailed,
        last_payment_error: undefined,
      };

      paymentRepository.findByProviderPaymentId.mockResolvedValue(
        mockPendingPayment as any,
      );
      paymentRepository.update.mockResolvedValue({
        ...mockPendingPayment,
        status: PaymentStatus.FAILED,
      } as any);

      await service.handlePaymentFailed(paymentIntentUndefinedError as any);

      expect(paymentRepository.update).toHaveBeenCalledWith(
        mockPendingPayment.id,
        {
          status: PaymentStatus.FAILED,
          failureReason: 'Payment failed',
        },
      );
    });
  });
});
