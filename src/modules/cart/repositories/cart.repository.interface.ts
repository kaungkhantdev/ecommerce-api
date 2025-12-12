import { IRepository } from '@/shared/repositories';
import { Cart } from 'generated/prisma/client';

/**
 * Category-specific repository interface
 * Extends generic IRepository and adds domain-specific methods
 */
export interface ICartRepository extends IRepository<Cart> {
  findByUserId(userId: string): Promise<any>;
  createCart(userId: string): Promise<any>;
  addItem(
    cartId: string,
    productId: string,
    quantity: number,
    price: number,
  ): Promise<any>;
  updateItemQuantity(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<any>;
  removeItem(cartId: string, productId: string): Promise<any>;
  clearCart(cartId: string): Promise<any>;
}
