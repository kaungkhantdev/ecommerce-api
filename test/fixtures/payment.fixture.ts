/**
 * Mock data for payment-related tests
 */

export const mockOrderDataWithProductsOnly = {
  items: [
    {
      product: {
        name: 'Test Product',
        description: 'Test Description',
        images: [{ url: 'https://example.com/image.jpg' }],
      },
      price: 99.99,
      quantity: 2,
    },
    {
      product: {
        name: 'Another Product',
        description: 'Another Description',
      },
      price: 49.5,
      quantity: 1,
    },
  ],
  shippingCost: 0,
  tax: 0,
};

export const mockOrderDataWithShipping = {
  items: [
    {
      product: {
        name: 'Test Product',
        description: 'Test Description',
      },
      price: 50,
      quantity: 1,
    },
  ],
  shippingCost: 10.5,
  tax: 0,
};

export const mockOrderDataWithTax = {
  items: [
    {
      product: {
        name: 'Test Product',
      },
      price: 100,
      quantity: 1,
    },
  ],
  shippingCost: 0,
  tax: 8.5,
};

export const mockOrderDataComplete = {
  items: [
    {
      product: {
        name: 'Product 1',
        description: 'Description 1',
      },
      price: 100,
      quantity: 2,
    },
    {
      product: {
        name: 'Product 2',
      },
      price: 50,
      quantity: 1,
    },
  ],
  shippingCost: 15,
  tax: 12.75,
};

export const mockOrderDataWithZeroShipping = {
  items: [
    {
      product: { name: 'Test Product' },
      price: 100,
      quantity: 1,
    },
  ],
  shippingCost: 0,
  tax: 5,
};

export const mockOrderDataWithZeroTax = {
  items: [
    {
      product: { name: 'Test Product' },
      price: 100,
      quantity: 1,
    },
  ],
  shippingCost: 10,
  tax: 0,
};

export const mockOrderDataWithStringValues = {
  items: [
    {
      product: { name: 'Test Product' },
      price: 100,
      quantity: 1,
    },
  ],
  shippingCost: '10.50',
  tax: '8.25',
};

export const mockOrderDataWithoutDescription = {
  items: [
    {
      product: {
        name: 'Test Product',
      },
      price: 50,
      quantity: 1,
    },
  ],
  shippingCost: 0,
  tax: 0,
};

export const mockOrderDataWithEmptyDescription = {
  items: [
    {
      product: {
        name: 'Test Product',
        description: '',
      },
      price: 50,
      quantity: 1,
    },
  ],
  shippingCost: 0,
  tax: 0,
};

export const mockOrderDataWithoutImages = {
  items: [
    {
      product: {
        name: 'Test Product',
      },
      price: 50,
      quantity: 1,
    },
  ],
  shippingCost: 0,
  tax: 0,
};

export const mockOrderDataWithEmptyImages = {
  items: [
    {
      product: {
        name: 'Test Product',
        images: [],
      },
      price: 50,
      quantity: 1,
    },
  ],
  shippingCost: 0,
  tax: 0,
};

export const mockOrderDataWithMultipleImages = {
  items: [
    {
      product: {
        name: 'Test Product',
        images: [
          { url: 'https://example.com/image1.jpg' },
          { url: 'https://example.com/image2.jpg' },
          { url: 'https://example.com/image3.jpg' },
        ],
      },
      price: 50,
      quantity: 1,
    },
  ],
  shippingCost: 0,
  tax: 0,
};

export const mockOrderDataForPriceConversion = {
  items: [
    {
      product: { name: 'Product 1' },
      price: 99.99,
      quantity: 1,
    },
    {
      product: { name: 'Product 2' },
      price: 0.99,
      quantity: 1,
    },
    {
      product: { name: 'Product 3' },
      price: 100,
      quantity: 1,
    },
  ],
  shippingCost: 5.5,
  tax: 10.25,
};

export const mockOrderDataForRounding = {
  items: [
    {
      product: { name: 'Product with rounding' },
      price: 99.995,
      quantity: 1,
    },
  ],
  shippingCost: 0,
  tax: 0,
};

export const mockOrderDataWithMultipleQuantities = {
  items: [
    {
      product: { name: 'Product 1' },
      price: 25,
      quantity: 3,
    },
    {
      product: { name: 'Product 2' },
      price: 50,
      quantity: 10,
    },
  ],
  shippingCost: 0,
  tax: 0,
};

export const mockOrderDataForCurrencyTest = {
  items: [
    {
      product: { name: 'Test Product' },
      price: 50,
      quantity: 1,
    },
  ],
  shippingCost: 10,
  tax: 5,
};

// Expected line item results
export const expectedLineItemWithShipping = {
  price_data: {
    currency: 'usd',
    product_data: {
      name: 'Shipping',
    },
    unit_amount: 1050,
  },
  quantity: 1,
};

export const expectedLineItemWithTax = {
  price_data: {
    currency: 'usd',
    product_data: {
      name: 'Tax',
    },
    unit_amount: 850,
  },
  quantity: 1,
};

// Payment records
export const mockPaymentId = 'payment-123';
export const mockOrderId = 'order-456';
export const mockUserId = 'user-789';
export const mockSessionId = 'cs_test_123';
export const mockPaymentIntentId = 'pi_test_123';
export const mockRefundId = 're_test_123';

export const mockCompletedPayment = {
  id: mockPaymentId,
  orderId: mockOrderId,
  amount: 100,
  currency: 'usd',
  status: 'COMPLETED',
  provider: 'STRIPE',
  transactionId: mockSessionId,
  providerPaymentId: mockPaymentIntentId,
  metadata: {},
  refundedAmount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  paidAt: new Date(),
  failureReason: null,
};

export const mockPendingPayment = {
  ...mockCompletedPayment,
  status: 'PENDING',
  paidAt: null,
};

export const mockFailedPayment = {
  ...mockCompletedPayment,
  status: 'FAILED',
  paidAt: null,
  failureReason: 'Insufficient funds',
};

export const mockPartiallyRefundedPayment = {
  ...mockCompletedPayment,
  refundedAmount: 30,
};

export const mockPaymentWithoutIntent = {
  ...mockCompletedPayment,
  providerPaymentId: null,
  transactionId: null,
};

export const mockPaymentWithMetadata = {
  ...mockCompletedPayment,
  metadata: {
    refunds: [
      {
        refundId: 're_previous_123',
        amount: 20,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
  },
};

// Order records
export const mockOrder = {
  id: mockOrderId,
  userId: mockUserId,
  total: 100,
  subtotal: 85,
  tax: 8.5,
  shippingCost: 6.5,
  status: 'PENDING',
  shippingAddressId: 'address-123',
  billingAddressId: 'address-123',
  user: {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockProcessingOrder = {
  ...mockOrder,
  status: 'PROCESSING',
};

// Stripe objects
export const mockStripeSession = {
  id: mockSessionId,
  object: 'checkout.session',
  payment_intent: mockPaymentIntentId,
  payment_status: 'paid',
  status: 'complete',
  url: 'https://checkout.stripe.com/session/123',
};

export const mockStripeSessionExpired = {
  ...mockStripeSession,
  status: 'expired',
  payment_status: 'unpaid',
};

export const mockStripePaymentIntent = {
  id: mockPaymentIntentId,
  object: 'payment_intent',
  status: 'succeeded',
  amount: 10000,
  currency: 'usd',
};

export const mockStripePaymentIntentFailed = {
  ...mockStripePaymentIntent,
  status: 'failed',
  last_payment_error: {
    message: 'Your card was declined',
  },
};

export const mockStripeRefund = {
  id: mockRefundId,
  object: 'refund',
  amount: 5000,
  currency: 'usd',
  status: 'succeeded',
  payment_intent: mockPaymentIntentId,
};
