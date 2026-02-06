import { Test, TestingModule } from '@nestjs/testing';
import { LineItemBuilderService } from './line-item-builder.service';
import {
  mockOrderDataWithProductsOnly,
  mockOrderDataWithShipping,
  mockOrderDataWithTax,
  mockOrderDataComplete,
  mockOrderDataWithZeroShipping,
  mockOrderDataWithZeroTax,
  mockOrderDataWithStringValues,
  mockOrderDataWithoutDescription,
  mockOrderDataWithEmptyDescription,
  mockOrderDataWithoutImages,
  mockOrderDataWithEmptyImages,
  mockOrderDataWithMultipleImages,
  mockOrderDataForPriceConversion,
  mockOrderDataForRounding,
  mockOrderDataWithMultipleQuantities,
  mockOrderDataForCurrencyTest,
  expectedLineItemWithShipping,
  expectedLineItemWithTax,
} from '../../../../test/fixtures/payment.fixture';

describe('LineItemBuilderService', () => {
  let service: LineItemBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LineItemBuilderService],
    }).compile();

    service = module.get<LineItemBuilderService>(LineItemBuilderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildLineItems', () => {
    it('should build line items with products only', () => {
      const result = service.buildLineItems(mockOrderDataWithProductsOnly);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Test Product',
            description: 'Test Description',
            images: ['https://example.com/image.jpg'],
          },
          unit_amount: 9999,
        },
        quantity: 2,
      });
      expect(result[1]).toEqual({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Another Product',
            description: 'Another Description',
            images: undefined,
          },
          unit_amount: 4950,
        },
        quantity: 1,
      });
    });

    it('should build line items with products and shipping', () => {
      const result = service.buildLineItems(mockOrderDataWithShipping);

      expect(result).toHaveLength(2);
      expect(result[0]?.price_data?.product_data?.name).toBe('Test Product');
      expect(result[1]).toEqual(expectedLineItemWithShipping);
    });

    it('should build line items with products and tax', () => {
      const result = service.buildLineItems(mockOrderDataWithTax);

      expect(result).toHaveLength(2);
      expect(result[0]?.price_data?.product_data?.name).toBe('Test Product');
      expect(result[1]).toEqual(expectedLineItemWithTax);
    });

    it('should build line items with products, shipping, and tax', () => {
      const result = service.buildLineItems(mockOrderDataComplete);

      expect(result).toHaveLength(4);
      expect(result[0]?.price_data?.product_data?.name).toBe('Product 1');
      expect(result[1]?.price_data?.product_data?.name).toBe('Product 2');
      expect(result[2]?.price_data?.product_data?.name).toBe('Shipping');
      expect(result[3]?.price_data?.product_data?.name).toBe('Tax');
    });

    it('should not include shipping when shippingCost is 0', () => {
      const result = service.buildLineItems(mockOrderDataWithZeroShipping);

      expect(result).toHaveLength(2);
      expect(
        result.find(
          (item) => item.price_data?.product_data?.name === 'Shipping',
        ),
      ).toBeUndefined();
    });

    it('should not include tax when tax is 0', () => {
      const result = service.buildLineItems(mockOrderDataWithZeroTax);

      expect(result).toHaveLength(2);
      expect(
        result.find((item) => item.price_data?.product_data?.name === 'Tax'),
      ).toBeUndefined();
    });

    it('should handle string values for shippingCost and tax', () => {
      const result = service.buildLineItems(mockOrderDataWithStringValues);

      expect(result).toHaveLength(3);
      expect(result[1]?.price_data?.unit_amount).toBe(1050);
      expect(result[2]?.price_data?.unit_amount).toBe(825);
    });

    it('should handle product without description', () => {
      const result = service.buildLineItems(mockOrderDataWithoutDescription);

      expect(result[0]?.price_data?.product_data?.description).toBeUndefined();
    });

    it('should handle product with empty description', () => {
      const result = service.buildLineItems(mockOrderDataWithEmptyDescription);

      expect(result[0]?.price_data?.product_data?.description).toBeUndefined();
    });

    it('should handle product without images', () => {
      const result = service.buildLineItems(mockOrderDataWithoutImages);

      expect(result[0]?.price_data?.product_data?.images).toBeUndefined();
    });

    it('should handle product with empty images array', () => {
      const result = service.buildLineItems(mockOrderDataWithEmptyImages);

      expect(result[0]?.price_data?.product_data?.images).toBeUndefined();
    });

    it('should use only the first image when multiple images exist', () => {
      const result = service.buildLineItems(mockOrderDataWithMultipleImages);

      expect(result[0]?.price_data?.product_data?.images).toEqual([
        'https://example.com/image1.jpg',
      ]);
    });

    it('should correctly convert prices to cents', () => {
      const result = service.buildLineItems(mockOrderDataForPriceConversion);

      expect(result[0]?.price_data?.unit_amount).toBe(9999);
      expect(result[1]?.price_data?.unit_amount).toBe(99);
      expect(result[2]?.price_data?.unit_amount).toBe(10000);
      expect(result[3]?.price_data?.unit_amount).toBe(550);
      expect(result[4]?.price_data?.unit_amount).toBe(1025);
    });

    it('should round prices correctly when converting to cents', () => {
      const result = service.buildLineItems(mockOrderDataForRounding);

      expect(result[0]?.price_data?.unit_amount).toBe(10000);
    });

    it('should handle multiple quantities correctly', () => {
      const result = service.buildLineItems(
        mockOrderDataWithMultipleQuantities,
      );

      expect(result[0].quantity).toBe(3);
      expect(result[1].quantity).toBe(10);
    });

    it('should use USD currency for all line items', () => {
      const result = service.buildLineItems(mockOrderDataForCurrencyTest);

      result.forEach((item) => {
        expect(item.price_data?.currency).toBe('usd');
      });
    });
  });
});
