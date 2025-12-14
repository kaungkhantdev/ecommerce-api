import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { ICartRepository } from '../cart/repositories/cart.repository.interface';
import { CATEGORY_REPOSITORY } from './categories.constants';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(CATEGORY_REPOSITORY)
    private readonly categoryRepository: ICartRepository,
  ) {}
  async create(createCategoryDto: CreateCategoryDto) {
    const data: any = {
      ...createCategoryDto,
      ...(createCategoryDto.parentId && {
        parent: { connect: { id: createCategoryDto.parentId } },
      }),
    };
    delete data.parentId;
    return this.categoryRepository.create(data);
  }

  async findAll() {
    return this.categoryRepository.findAll();
  }

  async findById(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findById(id);
    return this.categoryRepository.update(id, updateCategoryDto);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.categoryRepository.delete(id);
  }
}
