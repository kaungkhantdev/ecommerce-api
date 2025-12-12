import { IRepository } from '@/shared/repositories';
import { Inventory, Prisma } from 'generated/prisma/client';

export interface IInventoryRepository extends IRepository<Inventory> {
  create(data: Prisma.InventoryCreateInput): Promise<Inventory>;
  findByProductId(productId: string): Promise<Inventory>;
  updateQuantity(productId: string, quantity: number): Promise<Inventory>;
  reserveStock(productId: string, quantity: number): Promise<Inventory>;
  releaseStock(productId: string, quantity: number): Promise<Inventory>;
}
