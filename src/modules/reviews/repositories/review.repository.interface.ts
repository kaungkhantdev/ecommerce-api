import { IRepository } from '@/shared/repositories';
import { Review } from 'generated/prisma/browser';

/**
 * Review-specific repository interface
 * Extends generic IRepository and adds domain-specific methods
 */
export interface IReviewRepository extends IRepository<Review> {
  findByProductId(
    productId: string,
    skip?: number,
    take?: number,
  ): Promise<Review[]>;
}
