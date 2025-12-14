import { IRepository } from '@/shared/repositories';
import { Product } from 'generated/prisma/client';

export interface IProductRepository extends IRepository<Product> {
  findBySlug(slug: string): Promise<Product>;
  findFeatured(limit: number): Promise<Product[]>;
  searchByName(query: string, limit: number): Promise<Product[]>;
}
