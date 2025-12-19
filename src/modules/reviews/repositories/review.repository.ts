import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GenericRepository } from '@/shared/repositories';
import { Review, Prisma } from 'generated/prisma/client';
import { IReviewRepository } from './review.repository.interface';

@Injectable()
export class ReviewRepository
  extends GenericRepository<Review>
  implements IReviewRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, Prisma.ModelName.Review);
  }

  // Only custom methods - all CRUD inherited!

  async findByProductId(
    productId: string,
    skip?: number,
    take?: number,
  ): Promise<Review[]> {
    return (await this.model.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: skip ?? 0,
      take: take ?? 10,
    })) as Review[];
  }
}
