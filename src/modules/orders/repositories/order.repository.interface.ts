import { IRepository } from '@/shared/repositories';
import { Order, OrderStatus } from 'generated/prisma/client';

/**
 * Order-specific repository interface
 * Extends generic IRepository and adds domain-specific methods
 */
export interface IOrderRepository extends IRepository<Order> {
  findByUserId(userId: string): Promise<Order[]>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByUserIdAndId(userId: string, orderId: string): Promise<Order | null>;
  updateStatus(id: string, status: OrderStatus): Promise<Order>;
  findByStatus(status: OrderStatus): Promise<Order[]>;
}
