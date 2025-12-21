import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PaymentValidatorService } from './payment-validator.service';
import {
  mockCompletedPayment,
  mockPendingPayment,
  mockFailedPayment,
} from '../../../../test/fixtures/payment.fixture';

describe('PaymentValidatorService', () => {
  let service: PaymentValidatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentValidatorService],
    }).compile();

    service = module.get<PaymentValidatorService>(PaymentValidatorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateRefundable', () => {
    it('should not throw error when payment is completed', () => {
      expect(() => {
        service.validateRefundable(mockCompletedPayment);
      }).not.toThrow();
    });

    it('should throw BadRequestException when payment is pending', () => {
      expect(() => {
        service.validateRefundable(mockPendingPayment);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validateRefundable(mockPendingPayment);
      }).toThrow('Only completed payments can be refunded');
    });

    it('should throw BadRequestException when payment is failed', () => {
      expect(() => {
        service.validateRefundable(mockFailedPayment);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validateRefundable(mockFailedPayment);
      }).toThrow('Only completed payments can be refunded');
    });

    it('should throw BadRequestException for any non-completed status', () => {
      const refundedPayment = { ...mockCompletedPayment, status: 'REFUNDED' };

      expect(() => {
        service.validateRefundable(refundedPayment);
      }).toThrow(BadRequestException);
    });
  });

  describe('validateRefundAmount', () => {
    it('should not throw error for valid refund amount', () => {
      expect(() => {
        service.validateRefundAmount(50, 0, 100);
      }).not.toThrow();
    });

    it('should not throw error for full refund', () => {
      expect(() => {
        service.validateRefundAmount(100, 0, 100);
      }).not.toThrow();
    });

    it('should not throw error for partial refund after previous refund', () => {
      expect(() => {
        service.validateRefundAmount(30, 20, 100);
      }).not.toThrow();
    });

    it('should throw BadRequestException when refund amount is zero', () => {
      expect(() => {
        service.validateRefundAmount(0, 0, 100);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validateRefundAmount(0, 0, 100);
      }).toThrow('Invalid refund amount');
    });

    it('should throw BadRequestException when refund amount is negative', () => {
      expect(() => {
        service.validateRefundAmount(-10, 0, 100);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validateRefundAmount(-10, 0, 100);
      }).toThrow('Invalid refund amount');
    });

    it('should throw BadRequestException when refund exceeds remaining amount', () => {
      expect(() => {
        service.validateRefundAmount(60, 50, 100);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validateRefundAmount(60, 50, 100);
      }).toThrow(
        'Cannot refund more than the payment amount. Already refunded: 50, Total: 100',
      );
    });

    it('should throw BadRequestException when refund exceeds total amount', () => {
      expect(() => {
        service.validateRefundAmount(150, 0, 100);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validateRefundAmount(150, 0, 100);
      }).toThrow(
        'Cannot refund more than the payment amount. Already refunded: 0, Total: 100',
      );
    });

    it('should throw BadRequestException when trying to refund already fully refunded payment', () => {
      expect(() => {
        service.validateRefundAmount(1, 100, 100);
      }).toThrow(BadRequestException);
    });
  });

  describe('validatePaymentIntent', () => {
    it('should not throw error when payment intent exists', () => {
      expect(() => {
        service.validatePaymentIntent('pi_test_123');
      }).not.toThrow();
    });

    it('should throw BadRequestException when payment intent is null', () => {
      expect(() => {
        service.validatePaymentIntent(null);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validatePaymentIntent(null);
      }).toThrow('No payment intent found for this payment');
    });

    it('should throw BadRequestException when payment intent is undefined', () => {
      expect(() => {
        service.validatePaymentIntent(undefined);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validatePaymentIntent(undefined);
      }).toThrow('No payment intent found for this payment');
    });

    it('should throw BadRequestException when payment intent is empty string', () => {
      expect(() => {
        service.validatePaymentIntent('');
      }).toThrow(BadRequestException);
    });
  });

  describe('validateNotCompleted', () => {
    it('should not throw error when payment is null', () => {
      expect(() => {
        service.validateNotCompleted(null);
      }).not.toThrow();
    });

    it('should not throw error when payment is undefined', () => {
      expect(() => {
        service.validateNotCompleted(undefined);
      }).not.toThrow();
    });

    it('should not throw error when payment is pending', () => {
      expect(() => {
        service.validateNotCompleted(mockPendingPayment);
      }).not.toThrow();
    });

    it('should not throw error when payment is failed', () => {
      expect(() => {
        service.validateNotCompleted(mockFailedPayment);
      }).not.toThrow();
    });

    it('should throw BadRequestException when payment is already completed', () => {
      expect(() => {
        service.validateNotCompleted(mockCompletedPayment);
      }).toThrow(BadRequestException);

      expect(() => {
        service.validateNotCompleted(mockCompletedPayment);
      }).toThrow('Payment already completed for this order');
    });
  });
});
