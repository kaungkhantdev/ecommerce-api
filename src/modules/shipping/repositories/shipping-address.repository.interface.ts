import { IRepository } from '@/shared/repositories';
import { ShippingAddress } from 'generated/prisma/browser';

/**
 * ShippingAddress-specific repository interface
 * Extends generic IRepository and adds domain-specific methods
 */
export interface IShippingAddressRepository extends IRepository<ShippingAddress> {
  findByUserId(userId: string): Promise<ShippingAddress[]>;
  findDefaultByUserId(userId: string): Promise<ShippingAddress | null>;
  setAsDefault(id: string, userId: string): Promise<ShippingAddress>;
}
