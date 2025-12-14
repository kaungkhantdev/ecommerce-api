import { IRepository } from '@/shared/repositories/interfaces';
import { Category } from 'generated/prisma/client';

/**
 * Category-specific repository interface
 * Extends generic IRepository and adds domain-specific methods
 */
export interface ICategoryRepository extends IRepository<Category> {
  findBySlug(slug: string): Promise<Category>;
}
