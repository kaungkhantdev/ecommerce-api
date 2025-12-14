import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import {
  CreateProductDto,
  UpdateProductDto,
  FilterProductDto,
} from './dto/product.dto';
import { PRODUCT_REPOSITORY } from './products.constants';
import { IProductRepository } from './repositories/product.repository.interface';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const existingProduct = await this.productRepository.findBySlug(
      createProductDto.slug,
    );

    if (existingProduct) {
      throw new ConflictException('Product with this slug already exists');
    }

    const { images, ...productData } = createProductDto;

    const data: Prisma.ProductCreateInput = {
      ...productData,
      category: {
        connect: { id: createProductDto.categoryId },
      },
      ...(images && images.length > 0
        ? {
            images: {
              create: images,
            },
          }
        : {}),
    };

    return this.productRepository.create(data);
  }

  async findAll(filterDto: FilterProductDto) {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      isFeatured,
    } = filterDto;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined && { gte: minPrice }),
              ...(maxPrice !== undefined && { lte: maxPrice }),
            },
          }
        : {}),
      ...(isFeatured !== undefined && { isFeatured }),
    };

    const [products, total] = await Promise.all([
      this.productRepository.findAll({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.productRepository.count(where),
    ]);

    return {
      items: products,
      page,
      limit,
      total,
    };
  }

  async findById(id: string) {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.productRepository.findBySlug(slug);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findById(id);

    if (updateProductDto.slug) {
      const existingProduct = await this.productRepository.findBySlug(
        updateProductDto.slug,
      );

      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException('Product with this slug already exists');
      }
    }

    const data: Prisma.ProductUpdateInput = {
      ...updateProductDto,
      ...(updateProductDto.categoryId && {
        category: {
          connect: { id: updateProductDto.categoryId },
        },
      }),
    };

    return this.productRepository.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    return this.productRepository.delete(id);
  }
}
