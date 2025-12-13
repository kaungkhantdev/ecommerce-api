import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { IProductRepository } from './repositories/product.repository.interface';
import { PRODUCT_REPOSITORY } from './products.constants';
import { mockProduct } from '../../../test/fixtures/cart.fixture';

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

  describe('findById', () => {
    it('should return product when found', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      const result = await service.findById(mockProduct.id);
      expect(productRepository.findById).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProduct);
    });

    it('should return Product not found when not found', async () => {
      productRepository.findById.mockResolvedValue(null);
      await expect(service.findById('123')).rejects.toThrow(
        'Product not found',
      );
      expect(productRepository.findById).toHaveBeenCalledWith('123');
    });
  });
});
