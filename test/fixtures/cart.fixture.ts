import { Prisma } from '../../generated/prisma/client';

export const mockUserId = 'user-123';
export const mockCartId = 'cart-456';
export const mockProductId = 'product-789';

export const mockProduct = {
  id: mockProductId,
  name: 'Test Product',
  price: Prisma.Decimal(100),
  comparePrice: null,
  description: 'Test Description',
  slug: 'test-product',
  sku: 'TEST-SKU-001',
  categoryId: 'category-123',
  isActive: true,
  isFeatured: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCart = {
  id: mockCartId,
  userId: mockUserId,
  items: [
    {
      id: 'item-1',
      cartId: mockCartId,
      productId: mockProductId,
      quantity: 2,
      price: 100,
      product: mockProduct,
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockEmptyCart = {
  id: mockCartId,
  userId: mockUserId,
  items: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};
