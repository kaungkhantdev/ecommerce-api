import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ProductsService } from '../products/products.service';
import { IReviewRepository } from './repositories/review.repository.interface';
import { REVIEW_REPOSITORY } from './reviews.constants';
import {
  mockReview,
  mockReviewId,
  mockProductId,
  mockUserId,
  mockReviewList,
  mockCreateReviewDto,
  mockUpdateReviewDto,
} from '../../../test/fixtures/reviews.fixture';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepository: jest.Mocked<IReviewRepository>;
  let productsService: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const mockReviewRepository = {
      create: jest.fn(),
      findByProductId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const mockProductsService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: REVIEW_REPOSITORY, useValue: mockReviewRepository },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewRepository = module.get(REVIEW_REPOSITORY);
    productsService = module.get(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create review successfully', async () => {
      productsService.findById.mockResolvedValue({ id: mockProductId } as any);
      reviewRepository.create.mockResolvedValue(mockReview as any);

      const result = await service.create(mockUserId, mockCreateReviewDto);

      expect(productsService.findById).toHaveBeenCalledWith(mockProductId);
      expect(reviewRepository.create).toHaveBeenCalledWith({
        ...mockCreateReviewDto,
        user: { connect: { id: mockUserId } },
        product: { connect: { id: mockProductId } },
      });
      expect(result).toEqual(mockReview);
    });

    it('should throw error if product not found', async () => {
      productsService.findById.mockRejectedValue(
        new NotFoundException('Product not found'),
      );

      await expect(
        service.create(mockUserId, mockCreateReviewDto),
      ).rejects.toThrow('Product not found');

      expect(reviewRepository.create).not.toHaveBeenCalled();
    });

    it('should create review without comment', async () => {
      const dtoWithoutComment = {
        productId: mockProductId,
        rating: 5,
      };

      productsService.findById.mockResolvedValue({ id: mockProductId } as any);
      reviewRepository.create.mockResolvedValue({
        ...mockReview,
        comment: null,
      } as any);

      await service.create(mockUserId, dtoWithoutComment as any);

      expect(reviewRepository.create).toHaveBeenCalledWith({
        ...dtoWithoutComment,
        user: { connect: { id: mockUserId } },
        product: { connect: { id: mockProductId } },
      });
    });
  });

  describe('findByProductId', () => {
    it('should return paginated reviews', async () => {
      reviewRepository.findByProductId.mockResolvedValue(mockReviewList as any);
      reviewRepository.count.mockResolvedValue(3);

      const result = await service.findByProductId(mockProductId, 1, 10);

      expect(reviewRepository.findByProductId).toHaveBeenCalledWith(
        mockProductId,
        0,
        10,
      );
      expect(reviewRepository.count).toHaveBeenCalledWith({
        productId: mockProductId,
      });
      expect(result).toEqual({
        items: mockReviewList,
        page: 1,
        limit: 10,
        total: 3,
      });
    });

    it('should handle pagination with page 2', async () => {
      reviewRepository.findByProductId.mockResolvedValue([
        mockReviewList[2],
      ] as any);
      reviewRepository.count.mockResolvedValue(3);

      const result = await service.findByProductId(mockProductId, 2, 2);

      expect(reviewRepository.findByProductId).toHaveBeenCalledWith(
        mockProductId,
        2,
        2,
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
    });

    it('should return empty list when no reviews found', async () => {
      reviewRepository.findByProductId.mockResolvedValue([]);
      reviewRepository.count.mockResolvedValue(0);

      const result = await service.findByProductId(mockProductId);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should use default pagination values', async () => {
      reviewRepository.findByProductId.mockResolvedValue(mockReviewList as any);
      reviewRepository.count.mockResolvedValue(3);

      await service.findByProductId(mockProductId);

      expect(reviewRepository.findByProductId).toHaveBeenCalledWith(
        mockProductId,
        0,
        10,
      );
    });
  });

  describe('update', () => {
    it('should update review successfully', async () => {
      reviewRepository.findById.mockResolvedValue(mockReview as any);
      reviewRepository.update.mockResolvedValue({
        ...mockReview,
        ...mockUpdateReviewDto,
      } as any);

      const result = await service.update(
        mockReviewId,
        mockUserId,
        mockUpdateReviewDto,
      );

      expect(reviewRepository.findById).toHaveBeenCalledWith(mockReviewId);
      expect(reviewRepository.update).toHaveBeenCalledWith(
        mockReviewId,
        mockUpdateReviewDto,
      );
      expect(result.rating).toBe(mockUpdateReviewDto.rating);
    });

    it('should throw error if review not found', async () => {
      reviewRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(mockReviewId, mockUserId, mockUpdateReviewDto),
      ).rejects.toThrow('Review not found');

      expect(reviewRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if user is not authorized', async () => {
      reviewRepository.findById.mockResolvedValue(mockReview as any);

      await expect(
        service.update(mockReviewId, 'different-user', mockUpdateReviewDto),
      ).rejects.toThrow('Not authorized');

      expect(reviewRepository.update).not.toHaveBeenCalled();
    });

    it('should update only rating', async () => {
      const updateDto = { rating: 3 };
      reviewRepository.findById.mockResolvedValue(mockReview as any);
      reviewRepository.update.mockResolvedValue({
        ...mockReview,
        rating: 3,
      } as any);

      await service.update(mockReviewId, mockUserId, updateDto as any);

      expect(reviewRepository.update).toHaveBeenCalledWith(
        mockReviewId,
        updateDto,
      );
    });

    it('should update only comment', async () => {
      const updateDto = { comment: 'New comment' };
      reviewRepository.findById.mockResolvedValue(mockReview as any);
      reviewRepository.update.mockResolvedValue({
        ...mockReview,
        comment: 'New comment',
      } as any);

      await service.update(mockReviewId, mockUserId, updateDto as any);

      expect(reviewRepository.update).toHaveBeenCalledWith(
        mockReviewId,
        updateDto,
      );
    });
  });

  describe('delete', () => {
    it('should delete review successfully', async () => {
      reviewRepository.findById.mockResolvedValue(mockReview as any);
      reviewRepository.delete.mockResolvedValue(mockReview as any);

      const result = await service.delete(mockReviewId, mockUserId);

      expect(reviewRepository.findById).toHaveBeenCalledWith(mockReviewId);
      expect(reviewRepository.delete).toHaveBeenCalledWith(mockReviewId);
      expect(result).toEqual(mockReview);
    });

    it('should throw error if review not found', async () => {
      reviewRepository.findById.mockResolvedValue(null);

      await expect(service.delete(mockReviewId, mockUserId)).rejects.toThrow(
        'Review not found',
      );

      expect(reviewRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error if user is not authorized', async () => {
      reviewRepository.findById.mockResolvedValue(mockReview as any);

      await expect(
        service.delete(mockReviewId, 'different-user'),
      ).rejects.toThrow('Not authorized');

      expect(reviewRepository.delete).not.toHaveBeenCalled();
    });
  });
});
