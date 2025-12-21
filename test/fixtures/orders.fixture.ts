import { Prisma } from 'generated/prisma/client';

export const mockOrderId = 'order-123';
export const mockUserId = 'user-456';
export const mockOrderNumber = 'ORD-20240101-ABC123';

export const mockOrder = {
  id: mockOrderId,
  orderNumber: mockOrderNumber,
  userId: mockUserId,
  status: 'PENDING',
  totalPrice: 100,
  currency: 'USD',
  shippingAddressId: 'shipping-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockProcessingOrder = {
  id: 'order-456',
  orderNumber: 'ORD-20240102-DEF456',
  userId: mockUserId,
  status: 'PROCESSING',
  totalPrice: 200,
  currency: 'USD',
  shippingAddressId: 'shipping-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCompletedOrder = {
  id: 'order-789',
  orderNumber: 'ORD-20240103-GHI789',
  userId: mockUserId,
  status: 'COMPLETED',
  totalPrice: 150,
  currency: 'USD',
  shippingAddressId: 'shipping-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCancelledOrder = {
  id: 'order-999',
  orderNumber: 'ORD-20240104-JKL999',
  userId: mockUserId,
  status: 'CANCELLED',
  totalPrice: 75,
  currency: 'USD',
  shippingAddressId: 'shipping-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockOrderList = [
  mockOrder,
  mockProcessingOrder,
  mockCompletedOrder,
];

export const mockOrderItem = {
  id: 'order-item-123',
  orderId: mockOrderId,
  productId: 'product-123',
  quantity: 2,
  price: Prisma.Decimal(50),
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCreateOrderDto = {
  items: [
    {
      productId: 'product-123',
      quantity: 2,
    },
  ],
  shippingAddressId: 'shipping-123',
};

export const mockUpdateOrderDto = {
  status: 'PROCESSING',
};

export const mockOrderWithItems = {
  ...mockOrder,
  items: [mockOrderItem],
};
