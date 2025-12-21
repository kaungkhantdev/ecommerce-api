import { Test, TestingModule } from '@nestjs/testing';
import { RefundCalculatorService } from './refund-calculator.service';
import { PaymentStatus } from 'generated/prisma/client';

describe('RefundCalculatorService', () => {
  let service: RefundCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefundCalculatorService],
    }).compile();

    service = module.get<RefundCalculatorService>(RefundCalculatorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateRefund', () => {
    it('should calculate full refund when no amount specified', () => {
      const result = service.calculateRefund(undefined, 100, 0);

      expect(result).toEqual({
        amountToRefund: 100,
        totalRefunded: 100,
        isFullyRefunded: true,
        newStatus: PaymentStatus.REFUNDED,
      });
    });

    it('should calculate full refund when requested amount equals total', () => {
      const result = service.calculateRefund(100, 100, 0);

      expect(result).toEqual({
        amountToRefund: 100,
        totalRefunded: 100,
        isFullyRefunded: true,
        newStatus: PaymentStatus.REFUNDED,
      });
    });

    it('should calculate partial refund', () => {
      const result = service.calculateRefund(50, 100, 0);

      expect(result).toEqual({
        amountToRefund: 50,
        totalRefunded: 50,
        isFullyRefunded: false,
        newStatus: PaymentStatus.COMPLETED,
      });
    });

    it('should calculate refund with existing refunds', () => {
      const result = service.calculateRefund(30, 100, 20);

      expect(result).toEqual({
        amountToRefund: 30,
        totalRefunded: 50,
        isFullyRefunded: false,
        newStatus: PaymentStatus.COMPLETED,
      });
    });

    it('should calculate remaining refund when no amount specified with existing refunds', () => {
      const result = service.calculateRefund(undefined, 100, 30);

      expect(result).toEqual({
        amountToRefund: 70,
        totalRefunded: 100,
        isFullyRefunded: true,
        newStatus: PaymentStatus.REFUNDED,
      });
    });

    it('should mark as fully refunded when total refunded equals total amount', () => {
      const result = service.calculateRefund(50, 100, 50);

      expect(result.isFullyRefunded).toBe(true);
      expect(result.newStatus).toBe(PaymentStatus.REFUNDED);
    });

    it('should mark as fully refunded when total refunded exceeds total amount', () => {
      const result = service.calculateRefund(60, 100, 50);

      expect(result.totalRefunded).toBe(110);
      expect(result.isFullyRefunded).toBe(true);
      expect(result.newStatus).toBe(PaymentStatus.REFUNDED);
    });

    it('should handle small refund amounts', () => {
      const result = service.calculateRefund(0.01, 100, 0);

      expect(result).toEqual({
        amountToRefund: 0.01,
        totalRefunded: 0.01,
        isFullyRefunded: false,
        newStatus: PaymentStatus.COMPLETED,
      });
    });

    it('should handle decimal amounts correctly', () => {
      const result = service.calculateRefund(25.5, 100.75, 10.25);

      expect(result).toEqual({
        amountToRefund: 25.5,
        totalRefunded: 35.75,
        isFullyRefunded: false,
        newStatus: PaymentStatus.COMPLETED,
      });
    });
  });

  describe('toCents', () => {
    it('should convert dollars to cents', () => {
      expect(service.toCents(100)).toBe(10000);
    });

    it('should convert decimal amounts to cents', () => {
      expect(service.toCents(99.99)).toBe(9999);
    });

    it('should convert small amounts to cents', () => {
      expect(service.toCents(0.99)).toBe(99);
    });

    it('should round to nearest cent', () => {
      expect(service.toCents(99.995)).toBe(10000);
      expect(service.toCents(99.994)).toBe(9999);
    });

    it('should handle zero', () => {
      expect(service.toCents(0)).toBe(0);
    });

    it('should handle whole numbers', () => {
      expect(service.toCents(50)).toBe(5000);
    });

    it('should handle amounts with multiple decimal places', () => {
      expect(service.toCents(12.345)).toBe(1235);
    });
  });

  describe('createSuccessMessage', () => {
    it('should return full refund message when fully refunded', () => {
      const message = service.createSuccessMessage(true);
      expect(message).toBe('Full refund processed successfully');
    });

    it('should return partial refund message when partially refunded', () => {
      const message = service.createSuccessMessage(false);
      expect(message).toBe('Partial refund processed successfully');
    });
  });
});
