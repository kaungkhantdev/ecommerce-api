import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryRepository } from './repositories/category.repository';
import { CATEGORY_REPOSITORY } from './categories.constants';

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService,
    {
      provide: CATEGORY_REPOSITORY,
      useClass: CategoryRepository,
    },
  ],
  exports: [CategoriesService],
})
export class CategoriesModule {}
