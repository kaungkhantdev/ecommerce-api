import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GenericRepository } from '../../../shared/repositories/generic.repository';
import { ICategoryRepository } from './category.repository.interface';
import { Category, Prisma } from 'generated/prisma/client';

@Injectable()
export class CategoryRepository
  extends GenericRepository<Category>
  implements ICategoryRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, Prisma.ModelName.Category);
  }

  async findBySlug(slug: string): Promise<Category> {
    return this.model.findUnique({
      where: { slug },
    }) as Promise<Category>;
  }
}
