import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductsService } from '../products/products.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { REVIEW_REPOSITORY } from './reviews.constants';
import { IReviewRepository } from './repositories/review.repository.interface';

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(REVIEW_REPOSITORY)
    private readonly reviewRepository: IReviewRepository,
    private readonly productsService: ProductsService,
  ) {}

  async create(userId: string, createReviewDto: CreateReviewDto) {
    await this.productsService.findById(createReviewDto.productId);

    return this.reviewRepository.create({
      ...createReviewDto,
      user: { connect: { id: userId } },
      product: { connect: { id: createReviewDto.productId } },
    });
  }

  async findByProductId(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.reviewRepository.findByProductId(productId, skip, limit),
      this.reviewRepository.count({ productId }),
    ]);

    return {
      items: reviews,
      page,
      limit,
      total,
    };
  }

  async update(id: string, userId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.reviewRepository.findById(id);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new NotFoundException('Not authorized');
    }

    return this.reviewRepository.update(id, updateReviewDto);
  }

  async delete(id: string, userId: string) {
    const review = await this.reviewRepository.findById(id);

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.userId !== userId) {
      throw new NotFoundException('Not authorized');
    }

    return this.reviewRepository.delete(id);
  }
}
