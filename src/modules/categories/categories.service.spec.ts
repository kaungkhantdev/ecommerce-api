import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { ICategoryRepository } from './repositories/category.repository.interface';
import { CATEGORY_REPOSITORY } from './categories.constants';
import { mockCategory } from '../../../test/fixtures/categories.fixture';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: jest.Mocked<ICategoryRepository>;

  beforeEach(async () => {
    const mockCategoryRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CATEGORY_REPOSITORY, useValue: mockCategoryRepository },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    categoryRepository = module.get(CATEGORY_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return categories when found', async () => {
      categoryRepository.findAll.mockResolvedValue([mockCategory]);
      const result = await service.findAll();
      expect(categoryRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockCategory]);
    });

    it('should return [] when not found', async () => {
      categoryRepository.findAll.mockResolvedValue([]);
      const result = await service.findAll();
      expect(categoryRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return category when found', async () => {
      categoryRepository.findById.mockResolvedValue(mockCategory);
      const result = await service.findById(mockCategory.id);
      expect(categoryRepository.findById).toHaveBeenCalledWith(mockCategory.id);
      expect(result).toEqual(mockCategory);
    });

    it('should return NotFoundException when not found', async () => {
      categoryRepository.findById.mockResolvedValue(null);
      await expect(service.findById('234')).rejects.toThrow(
        'Category not found',
      );
      expect(categoryRepository.findById).toHaveBeenCalledWith('234');
    });
  });

  describe('update', () => {
    it('should update category when found', async () => {
      const updateDto = { name: 'Updated Category' };
      categoryRepository.findById.mockResolvedValue(mockCategory);
      categoryRepository.update.mockResolvedValue({
        ...mockCategory,
        ...updateDto,
      });
      const result = await service.update(mockCategory.id, updateDto);
      expect(categoryRepository.findById).toHaveBeenCalledWith(mockCategory.id);
      expect(categoryRepository.update).toHaveBeenCalledWith(
        mockCategory.id,
        updateDto,
      );
      expect(result).toEqual({ ...mockCategory, ...updateDto });
    });

    it('should throw NotFoundException when category not found', async () => {
      const updateDto = { name: 'Updated Category' };
      categoryRepository.findById.mockResolvedValue(null);
      await expect(service.update('234', updateDto)).rejects.toThrow(
        'Category not found',
      );
      expect(categoryRepository.findById).toHaveBeenCalledWith('234');
      expect(categoryRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete category when found', async () => {
      categoryRepository.findById.mockResolvedValue(mockCategory);
      categoryRepository.delete.mockResolvedValue(mockCategory);
      const result = await service.delete(mockCategory.id);
      expect(categoryRepository.findById).toHaveBeenCalledWith(mockCategory.id);
      expect(categoryRepository.delete).toHaveBeenCalledWith(mockCategory.id);
      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException when category not found', async () => {
      categoryRepository.findById.mockResolvedValue(null);
      await expect(service.delete('234')).rejects.toThrow('Category not found');
      expect(categoryRepository.findById).toHaveBeenCalledWith('234');
      expect(categoryRepository.delete).not.toHaveBeenCalled();
    });
  });
});
