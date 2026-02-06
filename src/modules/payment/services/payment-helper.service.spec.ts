import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PaymentHelperService } from './payment-helper.service';
import { IPaymentRepository } from '../repositories/payment.repository.interface';
import { IOrderRepository } from '../../orders/repositories/order.repository.interface';
import { PAYMENT_REPOSITORY } from '../payment.constants';
import { ORDER_REPOSITORY } from '../../orders/orders.constants';
import { StripeService } from '../stripe.service';
import {
  mockOrder,
  mockCompletedPayment,
  mockPaymentWithMetadata,
  mockStripeSession,
  mockUserId,
  mockOrderId,
  mockPaymentId,
  mockPaymentIntentId,
  mockSessionId,
  mockRefundId,
} from '../../../../test/fixtures/payment.fixture';

describe('PaymentHelperService', () => {
  let service: PaymentHelperService;
  let paymentRepository: jest.Mocked<IPaymentRepository>;
  let orderRepository: jest.Mocked<IOrderRepository>;
  let stripeService: jest.Mocked<StripeService>;

  beforeEach(async () => {
    const mockPaymentRepository = {
      findByOrderId: jest.fn(),
      update: jest.fn(),
    };

    const mockOrderRepository = {
      findByUserIdAndId: jest.fn(),
    };

    const mockStripeService = {
      retrieveSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentHelperService,
        { provide: PAYMENT_REPOSITORY, useValue: mockPaymentRepository },
        { provide: ORDER_REPOSITORY, useValue: mockOrderRepository },
        { provide: StripeService, useValue: mockStripeService },
      ],
    }).compile();

    service = module.get<PaymentHelperService>(PaymentHelperService);
    paymentRepository = module.get(PAYMENT_REPOSITORY);
    orderRepository = module.get(ORDER_REPOSITORY);
    stripeService = module.get(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOrderOrFail', () => {
    it('should return order when found', async () => {
      orderRepository.findByUserIdAndId.mockResolvedValue(mockOrder as any);

      const result = await service.findOrderOrFail(mockUserId, mockOrderId);

      expect(orderRepository.findByUserIdAndId).toHaveBeenCalledWith(
        mockUserId,
        mockOrderId,
      );
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order not found', async () => {
      orderRepository.findByUserIdAndId.mockResolvedValue(null);

      await expect(
        service.findOrderOrFail(mockUserId, mockOrderId),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.findOrderOrFail(mockUserId, mockOrderId),
      ).rejects.toThrow('Order not found');

      expect(orderRepository.findByUserIdAndId).toHaveBeenCalledWith(
        mockUserId,
        mockOrderId,
      );
    });
  });

  describe('findPaymentOrFail', () => {
    it('should return payment when found', async () => {
      paymentRepository.findByOrderId.mockResolvedValue(
        mockCompletedPayment as any,
      );

      const result = await service.findPaymentOrFail(mockOrderId);

      expect(paymentRepository.findByOrderId).toHaveBeenCalledWith(mockOrderId);
      expect(result).toEqual(mockCompletedPayment);
    });

    it('should throw NotFoundException when payment not found', async () => {
      paymentRepository.findByOrderId.mockResolvedValue(null);

      await expect(service.findPaymentOrFail(mockOrderId)).rejects.toThrow(
        NotFoundException,
      );

      await expect(service.findPaymentOrFail(mockOrderId)).rejects.toThrow(
        'Payment not found for this order',
      );

      expect(paymentRepository.findByOrderId).toHaveBeenCalledWith(mockOrderId);
    });
  });

  describe('getPaymentIntentId', () => {
    it('should return providerPaymentId when available', async () => {
      const result = await service.getPaymentIntentId(mockCompletedPayment);

      expect(result).toBe(mockPaymentIntentId);
      expect(stripeService.retrieveSession).not.toHaveBeenCalled();
    });

    it('should retrieve from session when providerPaymentId not available', async () => {
      const paymentWithoutIntent = {
        ...mockCompletedPayment,
        providerPaymentId: null,
      };

      stripeService.retrieveSession.mockResolvedValue(mockStripeSession as any);

      const result = await service.getPaymentIntentId(paymentWithoutIntent);

      expect(stripeService.retrieveSession).toHaveBeenCalledWith(mockSessionId);
      expect(result).toBe(mockPaymentIntentId);
    });

    it('should return null when no providerPaymentId and no transactionId', async () => {
      const paymentWithoutIntent = {
        ...mockCompletedPayment,
        providerPaymentId: null,
        transactionId: null,
      };

      const result = await service.getPaymentIntentId(paymentWithoutIntent);

      expect(result).toBeNull();
      expect(stripeService.retrieveSession).not.toHaveBeenCalled();
    });

    it('should handle session without payment_intent', async () => {
      const paymentWithoutIntent = {
        ...mockCompletedPayment,
        providerPaymentId: null,
      };

      const sessionWithoutIntent = {
        ...mockStripeSession,
        payment_intent: null,
      };

      stripeService.retrieveSession.mockResolvedValue(
        sessionWithoutIntent as any,
      );

      const result = await service.getPaymentIntentId(paymentWithoutIntent);

      expect(result).toBeNull();
    });
  });

  describe('generateIdempotencyKey', () => {
    it('should generate idempotency key with order ID and timestamp', () => {
      const result = service.generateIdempotencyKey(mockOrderId);

      expect(result).toMatch(/^order_order-456_\d+$/);
      expect(result).toContain('order_');
      expect(result).toContain(mockOrderId);
    });

    it('should generate different keys for subsequent calls', async () => {
      const key1 = service.generateIdempotencyKey(mockOrderId);
      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 5));
      const key2 = service.generateIdempotencyKey(mockOrderId);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different order IDs', () => {
      const key1 = service.generateIdempotencyKey('order-1');
      const key2 = service.generateIdempotencyKey('order-2');

      expect(key1).toContain('order-1');
      expect(key2).toContain('order-2');
      expect(key1).not.toBe(key2);
    });
  });

  describe('createPaymentMetadata', () => {
    it('should create metadata with session ID and URL', () => {
      const sessionUrl = 'https://checkout.stripe.com/session/123';
      const result = service.createPaymentMetadata(mockSessionId, sessionUrl);

      expect(result).toEqual({
        sessionId: mockSessionId,
        sessionUrl: sessionUrl,
      });
    });

    it('should create metadata with null session URL', () => {
      const result = service.createPaymentMetadata(mockSessionId, null);

      expect(result).toEqual({
        sessionId: mockSessionId,
        sessionUrl: null,
      });
    });
  });

  describe('buildRefundMetadata', () => {
    it('should build refund metadata with all fields', () => {
      const result = service.buildRefundMetadata(
        mockRefundId,
        50,
        'Customer request',
      );

      expect(result).toEqual({
        refundId: mockRefundId,
        amount: 50,
        reason: 'Customer request',
        createdAt: expect.any(String),
      });
      expect(new Date(result.createdAt)).toBeInstanceOf(Date);
    });

    it('should build refund metadata without reason', () => {
      const result = service.buildRefundMetadata(mockRefundId, 50);

      expect(result).toEqual({
        refundId: mockRefundId,
        amount: 50,
        reason: undefined,
        createdAt: expect.any(String),
      });
    });

    it('should include valid ISO timestamp', () => {
      const result = service.buildRefundMetadata(mockRefundId, 50);
      const timestamp = new Date(result.createdAt);

      expect(timestamp.toISOString()).toBe(result.createdAt);
    });
  });

  describe('updatePaymentRefundMetadata', () => {
    it('should update payment metadata with new refund', async () => {
      const payment = { ...mockCompletedPayment, metadata: {} };
      paymentRepository.update.mockResolvedValue(payment as any);

      await service.updatePaymentRefundMetadata(
        payment,
        mockRefundId,
        50,
        'Customer request',
      );

      expect(paymentRepository.update).toHaveBeenCalledWith(mockPaymentId, {
        metadata: {
          refunds: [
            {
              refundId: mockRefundId,
              amount: 50,
              reason: 'Customer request',
              createdAt: expect.any(String),
            },
          ],
        },
      });
    });

    it('should append to existing refunds in metadata', async () => {
      paymentRepository.update.mockResolvedValue(
        mockPaymentWithMetadata as any,
      );

      await service.updatePaymentRefundMetadata(
        mockPaymentWithMetadata,
        mockRefundId,
        30,
      );

      expect(paymentRepository.update).toHaveBeenCalledWith(mockPaymentId, {
        metadata: {
          refunds: [
            {
              refundId: 're_previous_123',
              amount: 20,
              createdAt: '2024-01-01T00:00:00.000Z',
            },
            {
              refundId: mockRefundId,
              amount: 30,
              reason: undefined,
              createdAt: expect.any(String),
            },
          ],
        },
      });
    });

    it('should handle payment with null metadata', async () => {
      const paymentWithNullMetadata = {
        ...mockCompletedPayment,
        metadata: null,
      };
      paymentRepository.update.mockResolvedValue(
        paymentWithNullMetadata as any,
      );

      await service.updatePaymentRefundMetadata(
        paymentWithNullMetadata,
        mockRefundId,
        50,
      );

      expect(paymentRepository.update).toHaveBeenCalledWith(mockPaymentId, {
        metadata: {
          refunds: [
            {
              refundId: mockRefundId,
              amount: 50,
              reason: undefined,
              createdAt: expect.any(String),
            },
          ],
        },
      });
    });

    it('should preserve other metadata fields when adding refund', async () => {
      const paymentWithExtraMetadata = {
        ...mockCompletedPayment,
        metadata: {
          customField: 'value',
          otherData: 123,
        },
      };
      paymentRepository.update.mockResolvedValue(
        paymentWithExtraMetadata as any,
      );

      await service.updatePaymentRefundMetadata(
        paymentWithExtraMetadata,
        mockRefundId,
        50,
      );

      expect(paymentRepository.update).toHaveBeenCalledWith(mockPaymentId, {
        metadata: {
          customField: 'value',
          otherData: 123,
          refunds: [
            {
              refundId: mockRefundId,
              amount: 50,
              reason: undefined,
              createdAt: expect.any(String),
            },
          ],
        },
      });
    });
  });
});
