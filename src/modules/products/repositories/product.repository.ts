import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GenericRepository } from '../../../shared/repositories/generic.repository';
import { Prisma, Product } from 'generated/prisma/client';
import { IProductRepository } from './product.repository.interface';

@Injectable()
export class ProductRepository
  extends GenericRepository<Product>
  implements IProductRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, Prisma.ModelName.Product);
  }

  // Only custom methods - all CRUD inherited!

  async findBySlug(slug: string) {
    return (await this.model.findUnique({
      where: { slug },
      include: {
        category: true,
        images: true,
        variants: true,
        inventory: true,
      },
    })) as Product;
  }

  async findFeatured(limit = 10): Promise<Product[]> {
    return (await this.model.findMany({
      where: {
        isActive: true,
        isFeatured: true,
      },
      include: {
        category: true,
        images: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })) as Product[];
  }

  async searchByName(query: string, limit = 20) {
    return (await this.model.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
        images: true,
      },
      take: limit,
    })) as Product[];
  }
}
