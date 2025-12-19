import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { ProductsModule } from '../products/products.module';
import { REVIEW_REPOSITORY } from './reviews.constants';
import { ReviewRepository } from './repositories/review.repository';

@Module({
  imports: [ProductsModule],
  controllers: [ReviewsController],
  providers: [
    ReviewsService,
    {
      provide: REVIEW_REPOSITORY,
      useClass: ReviewRepository,
    },
  ],
  exports: [ReviewsService],
})
export class ReviewsModule {}
