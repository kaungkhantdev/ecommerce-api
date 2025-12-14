import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { IInventoryRepository } from './repositories/inventory.repository.interface';
import { INVENTORY_REPOSITORY } from './inventory.constants';
import { mockInventory } from '../../../test/fixtures/inventory.fixture';

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepository: jest.Mocked<IInventoryRepository>;

  beforeEach(async () => {
    const mockInventoryRepository = {
      findByProductId: jest.fn(),
      updateQuantity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: INVENTORY_REPOSITORY,
          useValue: mockInventoryRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    inventoryRepository = module.get(INVENTORY_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInventory', () => {
    it('should return inventory when found', async () => {
      inventoryRepository.findByProductId.mockResolvedValue(mockInventory);
      const result = await service.getInventory(mockInventory.productId);
      expect(inventoryRepository.findByProductId).toHaveBeenCalledWith(
        mockInventory.productId,
      );
      expect(result).toEqual(mockInventory);
    });
  });

  describe('updateQuantity', () => {
    it('should update inventory', async () => {
      const updateDto = { quantity: 3 };
      inventoryRepository.updateQuantity.mockResolvedValue({
        ...mockInventory,
        ...updateDto,
      });
      const result = await service.updateQuantity(
        mockInventory.productId,
        updateDto.quantity,
      );
      expect(inventoryRepository.updateQuantity).toHaveBeenCalledWith(
        mockInventory.productId,
        updateDto.quantity,
      );
      expect(result).toEqual({ ...mockInventory, ...updateDto });
    });
  });

  describe('checkAvailability', () => {
    it('should return true if enough quantity is available', async () => {
      inventoryRepository.findByProductId.mockResolvedValue(mockInventory);

      const result = await service.checkAvailability(
        mockInventory.productId,
        1,
      );
      expect(inventoryRepository.findByProductId).toHaveBeenCalledWith(
        mockInventory.productId,
      );
      expect(result).toBe(true);
    });
  });
});
