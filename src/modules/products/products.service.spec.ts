import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { IProductRepository } from './repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from './products.constants';
import { mockProduct } from '../../../test/fixtures/cart.fixture';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: jest.Mocked<IProductRepository>;

  beforeEach(async () => {
    const mockProductRepository = {
      findBySlug: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PRODUCT_REPOSITORY, useValue: mockProductRepository },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get(PRODUCT_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createProductDto = {
      name: 'New Product',
      slug: 'new-product',
      description: 'A new product',
      price: 150,
      sku: 'NEW-SKU-001',
      categoryId: 'category-123',
      isActive: true,
      isFeatured: false,
    };

    it('should create a product successfully', async () => {
      productRepository.findBySlug.mockResolvedValue(null as any);
      productRepository.create.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(productRepository.findBySlug).toHaveBeenCalledWith(
        createProductDto.slug,
      );
      expect(productRepository.create).toHaveBeenCalledWith({
        name: createProductDto.name,
        slug: createProductDto.slug,
        description: createProductDto.description,
        price: createProductDto.price,
        sku: createProductDto.sku,
        categoryId: createProductDto.categoryId,
        isActive: createProductDto.isActive,
        isFeatured: createProductDto.isFeatured,
        category: {
          connect: { id: createProductDto.categoryId },
        },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should create a product with images', async () => {
      const createProductDtoWithImages = {
        ...createProductDto,
        images: [
          { url: 'image1.jpg', altText: 'Image 1' },
          { url: 'image2.jpg', altText: 'Image 2' },
        ],
      };

      productRepository.findBySlug.mockResolvedValue(null as any);
      productRepository.create.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDtoWithImages);

      expect(productRepository.create).toHaveBeenCalledWith({
        name: createProductDto.name,
        slug: createProductDto.slug,
        description: createProductDto.description,
        price: createProductDto.price,
        sku: createProductDto.sku,
        categoryId: createProductDto.categoryId,
        isActive: createProductDto.isActive,
        isFeatured: createProductDto.isFeatured,
        category: {
          connect: { id: createProductDto.categoryId },
        },
        images: {
          create: createProductDtoWithImages.images,
        },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw ConflictException when product with slug already exists', async () => {
      productRepository.findBySlug.mockResolvedValue(mockProduct);

      await expect(service.create(createProductDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createProductDto)).rejects.toThrow(
        'Product with this slug already exists',
      );
      expect(productRepository.findBySlug).toHaveBeenCalledWith(
        createProductDto.slug,
      );
      expect(productRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockProducts = [mockProduct];
    const totalCount = 1;

    it('should return paginated products with default parameters', async () => {
      productRepository.findAll.mockResolvedValue(mockProducts);
      productRepository.count.mockResolvedValue(totalCount);

      const result = await service.findAll({});

      expect(productRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(productRepository.count).toHaveBeenCalledWith({ isActive: true });
      expect(result).toEqual({
        items: mockProducts,
        page: 1,
        limit: 10,
        total: totalCount,
      });
    });

    it('should return paginated products with custom page and limit', async () => {
      productRepository.findAll.mockResolvedValue(mockProducts);
      productRepository.count.mockResolvedValue(totalCount);

      const result = await service.findAll({ page: 2, limit: 20 });

      expect(productRepository.findAll).toHaveBeenCalledWith({
        skip: 20,
        take: 20,
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it('should filter products by search term', async () => {
      productRepository.findAll.mockResolvedValue(mockProducts);
      productRepository.count.mockResolvedValue(totalCount);

      await service.findAll({ search: 'test' });

      expect(productRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter products by categoryId', async () => {
      productRepository.findAll.mockResolvedValue(mockProducts);
      productRepository.count.mockResolvedValue(totalCount);

      await service.findAll({ categoryId: 'category-123' });

      expect(productRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { isActive: true, categoryId: 'category-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter products by price range', async () => {
      productRepository.findAll.mockResolvedValue(mockProducts);
      productRepository.count.mockResolvedValue(totalCount);

      await service.findAll({ minPrice: 50, maxPrice: 200 });

      expect(productRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          isActive: true,
          price: { gte: 50, lte: 200 },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter products by minPrice only', async () => {
      productRepository.findAll.mockResolvedValue(mockProducts);
      productRepository.count.mockResolvedValue(totalCount);

      await service.findAll({ minPrice: 50 });

      expect(productRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          isActive: true,
          price: { gte: 50 },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter products by maxPrice only', async () => {
      productRepository.findAll.mockResolvedValue(mockProducts);
      productRepository.count.mockResolvedValue(totalCount);

      await service.findAll({ maxPrice: 200 });

      expect(productRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          isActive: true,
          price: { lte: 200 },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter products by isFeatured', async () => {
      productRepository.findAll.mockResolvedValue(mockProducts);
      productRepository.count.mockResolvedValue(totalCount);

      await service.findAll({ isFeatured: true });

      expect(productRepository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: { isActive: true, isFeatured: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter products with multiple filters combined', async () => {
      productRepository.findAll.mockResolvedValue(mockProducts);
      productRepository.count.mockResolvedValue(totalCount);

      await service.findAll({
        search: 'test',
        categoryId: 'category-123',
        minPrice: 50,
        maxPrice: 200,
        isFeatured: true,
        page: 2,
        limit: 5,
      });

      expect(productRepository.findAll).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
        where: {
          isActive: true,
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
          ],
          categoryId: 'category-123',
          price: { gte: 50, lte: 200 },
          isFeatured: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return product when found', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      const result = await service.findById(mockProduct.id);
      expect(productRepository.findById).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);
      await expect(service.findById('123')).rejects.toThrow(NotFoundException);
      await expect(service.findById('123')).rejects.toThrow(
        'Product not found',
      );
      expect(productRepository.findById).toHaveBeenCalledWith('123');
    });
  });

  describe('findBySlug', () => {
    it('should return product when found by slug', async () => {
      productRepository.findBySlug.mockResolvedValue(mockProduct);
      const result = await service.findBySlug(mockProduct.slug);
      expect(productRepository.findBySlug).toHaveBeenCalledWith(
        mockProduct.slug,
      );
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found by slug', async () => {
      productRepository.findBySlug.mockResolvedValue(null as any);
      await expect(service.findBySlug('non-existent-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySlug('non-existent-slug')).rejects.toThrow(
        'Product not found',
      );
      expect(productRepository.findBySlug).toHaveBeenCalledWith(
        'non-existent-slug',
      );
    });
  });

  describe('update', () => {
    const updateProductDto = {
      name: 'Updated Product',
      price: 200,
    };

    it('should update product successfully', async () => {
      const updatedProduct = { ...mockProduct, name: 'Updated Product' };
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.update.mockResolvedValue(updatedProduct);

      const result = await service.update(mockProduct.id, updateProductDto);

      expect(productRepository.findById).toHaveBeenCalledWith(mockProduct.id);
      expect(productRepository.update).toHaveBeenCalledWith(mockProduct.id, {
        name: updateProductDto.name,
        price: updateProductDto.price,
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should update product with category', async () => {
      const updateDtoWithCategory = {
        name: 'Updated Product',
        categoryId: 'new-category-456',
      };
      const updatedProduct = { ...mockProduct, ...updateDtoWithCategory };
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.update.mockResolvedValue(updatedProduct);

      const result = await service.update(
        mockProduct.id,
        updateDtoWithCategory,
      );

      expect(productRepository.update).toHaveBeenCalledWith(mockProduct.id, {
        name: updateDtoWithCategory.name,
        categoryId: updateDtoWithCategory.categoryId,
        category: {
          connect: { id: updateDtoWithCategory.categoryId },
        },
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should update product with new slug', async () => {
      const updateDtoWithSlug = {
        slug: 'new-slug',
      };
      const updatedProduct = { ...mockProduct, slug: 'new-slug' };
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.findBySlug.mockResolvedValue(null as any);
      productRepository.update.mockResolvedValue(updatedProduct);

      const result = await service.update(mockProduct.id, updateDtoWithSlug);

      expect(productRepository.findBySlug).toHaveBeenCalledWith('new-slug');
      expect(productRepository.update).toHaveBeenCalledWith(mockProduct.id, {
        slug: 'new-slug',
      });
      expect(result).toEqual(updatedProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateProductDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent-id', updateProductDto),
      ).rejects.toThrow('Product not found');
      expect(productRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when updating to existing slug', async () => {
      const anotherProduct = {
        ...mockProduct,
        id: 'another-product-id',
        slug: 'another-slug',
      };
      const updateDtoWithSlug = { slug: 'another-slug' };

      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.findBySlug.mockResolvedValue(anotherProduct);

      await expect(
        service.update(mockProduct.id, updateDtoWithSlug),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.update(mockProduct.id, updateDtoWithSlug),
      ).rejects.toThrow('Product with this slug already exists');
      expect(productRepository.update).not.toHaveBeenCalled();
    });

    it('should allow updating with same slug', async () => {
      const updateDtoWithSameSlug = { slug: mockProduct.slug };
      const updatedProduct = { ...mockProduct };

      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.findBySlug.mockResolvedValue(mockProduct);
      productRepository.update.mockResolvedValue(updatedProduct);

      const result = await service.update(
        mockProduct.id,
        updateDtoWithSameSlug,
      );

      expect(productRepository.update).toHaveBeenCalledWith(mockProduct.id, {
        slug: mockProduct.slug,
      });
      expect(result).toEqual(updatedProduct);
    });
  });

  describe('delete', () => {
    it('should delete product successfully', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      productRepository.delete.mockResolvedValue(mockProduct);

      const result = await service.delete(mockProduct.id);

      expect(productRepository.findById).toHaveBeenCalledWith(mockProduct.id);
      expect(productRepository.delete).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findById.mockResolvedValue(null);

      await expect(service.delete('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.delete('non-existent-id')).rejects.toThrow(
        'Product not found',
      );
      expect(productRepository.delete).not.toHaveBeenCalled();
    });
  });
});
