import { Prisma } from 'generated/prisma/client';

export const mockProduct = {
  id: 'product-123',
  name: 'apple',
  slug: 'apple',
  description: 'product description',
  price: Prisma.Decimal(100),
  comparePrice: Prisma.Decimal(120),
  sku: 'apple-23',
  categoryId: '1',
  isActive: true,
  isFeatured: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
