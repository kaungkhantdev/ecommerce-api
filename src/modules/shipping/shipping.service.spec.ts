import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from './shipping.service';
import { IShippingAddressRepository } from './repositories/shipping-address.repository.interface';
import { SHIPPING_ADDRESS_REPOSITORY } from './shipping.constants';
import {
  mockShippingAddress,
  mockShippingAddressNonDefault,
  mockShippingAddressId,
  mockUserId,
  mockShippingAddressList,
  mockCreateShippingAddressDto,
  mockUpdateShippingAddressDto,
} from '../../../test/fixtures/shipping.fixture';

describe('ShippingService', () => {
  let service: ShippingService;
  let shippingAddressRepository: jest.Mocked<IShippingAddressRepository>;

  beforeEach(async () => {
    const mockShippingAddressRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      findDefaultByUserId: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      setAsDefault: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShippingService,
        {
          provide: SHIPPING_ADDRESS_REPOSITORY,
          useValue: mockShippingAddressRepository,
        },
      ],
    }).compile();

    service = module.get<ShippingService>(ShippingService);
    shippingAddressRepository = module.get(SHIPPING_ADDRESS_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create shipping address successfully', async () => {
      shippingAddressRepository.create.mockResolvedValue(
        mockShippingAddress as any,
      );

      const result = await service.create(
        mockUserId,
        mockCreateShippingAddressDto,
      );

      expect(shippingAddressRepository.create).toHaveBeenCalledWith({
        ...mockCreateShippingAddressDto,
        user: { connect: { id: mockUserId } },
      });
      expect(result).toEqual(mockShippingAddress);
    });

    it('should unset other default addresses when creating default address', async () => {
      shippingAddressRepository.updateMany.mockResolvedValue({
        count: 0,
      } as any);
      shippingAddressRepository.create.mockResolvedValue(
        mockShippingAddress as any,
      );

      await service.create(mockUserId, mockCreateShippingAddressDto);

      expect(shippingAddressRepository.updateMany).toHaveBeenCalledWith(
        { userId: mockUserId, isDefault: true },
        { isDefault: false },
      );
    });

    it('should not unset other addresses when creating non-default address', async () => {
      const nonDefaultDto = {
        ...mockCreateShippingAddressDto,
        isDefault: false,
      };

      shippingAddressRepository.create.mockResolvedValue(
        mockShippingAddressNonDefault as any,
      );

      await service.create(mockUserId, nonDefaultDto);

      expect(shippingAddressRepository.updateMany).not.toHaveBeenCalled();
    });

    it('should create address without optional fields', async () => {
      const minimalDto = {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        phone: '+1234567890',
      };

      shippingAddressRepository.create.mockResolvedValue({
        ...mockShippingAddress,
        isDefault: false,
      } as any);

      await service.create(mockUserId, minimalDto as any);

      expect(shippingAddressRepository.create).toHaveBeenCalledWith({
        ...minimalDto,
        user: { connect: { id: mockUserId } },
      });
    });
  });

  describe('findAll', () => {
    it('should return all shipping addresses for user', async () => {
      shippingAddressRepository.findByUserId.mockResolvedValue(
        mockShippingAddressList as any,
      );

      const result = await service.findAll(mockUserId);

      expect(shippingAddressRepository.findByUserId).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(result).toEqual(mockShippingAddressList);
    });

    it('should return empty array when user has no addresses', async () => {
      shippingAddressRepository.findByUserId.mockResolvedValue([]);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return shipping address when found and authorized', async () => {
      shippingAddressRepository.findById.mockResolvedValue(
        mockShippingAddress as any,
      );

      const result = await service.findById(mockShippingAddressId, mockUserId);

      expect(shippingAddressRepository.findById).toHaveBeenCalledWith(
        mockShippingAddressId,
      );
      expect(result).toEqual(mockShippingAddress);
    });

    it('should throw error if address not found', async () => {
      shippingAddressRepository.findById.mockResolvedValue(null);

      await expect(
        service.findById(mockShippingAddressId, mockUserId),
      ).rejects.toThrow('Shipping address not found');
    });

    it('should throw error if user is not authorized', async () => {
      shippingAddressRepository.findById.mockResolvedValue(
        mockShippingAddress as any,
      );

      await expect(
        service.findById(mockShippingAddressId, 'different-user'),
      ).rejects.toThrow('Shipping address not found');
    });
  });

  describe('findDefault', () => {
    it('should return default shipping address', async () => {
      shippingAddressRepository.findDefaultByUserId.mockResolvedValue(
        mockShippingAddress as any,
      );

      const result = await service.findDefault(mockUserId);

      expect(
        shippingAddressRepository.findDefaultByUserId,
      ).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockShippingAddress);
    });

    it('should throw error if no default address found', async () => {
      shippingAddressRepository.findDefaultByUserId.mockResolvedValue(null);

      await expect(service.findDefault(mockUserId)).rejects.toThrow(
        'No default shipping address found',
      );
    });
  });

  describe('update', () => {
    it('should update shipping address successfully', async () => {
      shippingAddressRepository.findById.mockResolvedValue(
        mockShippingAddress as any,
      );
      shippingAddressRepository.update.mockResolvedValue({
        ...mockShippingAddress,
        ...mockUpdateShippingAddressDto,
      } as any);

      const result = await service.update(
        mockShippingAddressId,
        mockUserId,
        mockUpdateShippingAddressDto,
      );

      expect(shippingAddressRepository.findById).toHaveBeenCalledWith(
        mockShippingAddressId,
      );
      expect(shippingAddressRepository.update).toHaveBeenCalledWith(
        mockShippingAddressId,
        mockUpdateShippingAddressDto,
      );
      expect(result.firstName).toBe(mockUpdateShippingAddressDto.firstName);
    });

    it('should throw error if address not found', async () => {
      shippingAddressRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(
          mockShippingAddressId,
          mockUserId,
          mockUpdateShippingAddressDto,
        ),
      ).rejects.toThrow('Shipping address not found');

      expect(shippingAddressRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error if user is not authorized', async () => {
      shippingAddressRepository.findById.mockResolvedValue(
        mockShippingAddress as any,
      );

      await expect(
        service.update(
          mockShippingAddressId,
          'different-user',
          mockUpdateShippingAddressDto,
        ),
      ).rejects.toThrow('Shipping address not found');

      expect(shippingAddressRepository.update).not.toHaveBeenCalled();
    });

    it('should unset other default addresses when updating to default', async () => {
      const updateToDefault = {
        ...mockUpdateShippingAddressDto,
        isDefault: true,
      };

      shippingAddressRepository.findById.mockResolvedValue(
        mockShippingAddressNonDefault as any,
      );
      shippingAddressRepository.update.mockResolvedValue({
        ...mockShippingAddressNonDefault,
        isDefault: true,
      } as any);

      await service.update(
        mockShippingAddressId,
        mockUserId,
        updateToDefault as any,
      );

      expect(shippingAddressRepository.updateMany).toHaveBeenCalledWith(
        { userId: mockUserId, isDefault: true },
        { isDefault: false },
      );
    });

    it('should not unset other addresses when updating to non-default', async () => {
      shippingAddressRepository.findById.mockResolvedValue(
        mockShippingAddress as any,
      );
      shippingAddressRepository.update.mockResolvedValue(
        mockShippingAddress as any,
      );

      await service.update(
        mockShippingAddressId,
        mockUserId,
        mockUpdateShippingAddressDto,
      );

      expect(shippingAddressRepository.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('setAsDefault', () => {
    it('should set address as default successfully', async () => {
      shippingAddressRepository.findById.mockResolvedValue(
        mockShippingAddressNonDefault as any,
      );
      shippingAddressRepository.setAsDefault.mockResolvedValue({
        ...mockShippingAddressNonDefault,
        isDefault: true,
      } as any);

      const result = await service.setAsDefault(
        mockShippingAddressId,
        mockUserId,
      );

      expect(shippingAddressRepository.findById).toHaveBeenCalledWith(
        mockShippingAddressId,
      );
      expect(shippingAddressRepository.setAsDefault).toHaveBeenCalledWith(
        mockShippingAddressId,
        mockUserId,
      );
      expect(result.isDefault).toBe(true);
    });

    it('should throw error if address not found', async () => {
      shippingAddressRepository.findById.mockResolvedValue(null);

      await expect(
        service.setAsDefault(mockShippingAddressId, mockUserId),
      ).rejects.toThrow('Shipping address not found');

      expect(shippingAddressRepository.setAsDefault).not.toHaveBeenCalled();
    });

    it('should throw error if user is not authorized', async () => {
      shippingAddressRepository.findById.mockResolvedValue(
        mockShippingAddress as any,
      );

      await expect(
        service.setAsDefault(mockShippingAddressId, 'different-user'),
      ).rejects.toThrow('Shipping address not found');

      expect(shippingAddressRepository.setAsDefault).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete shipping address successfully', async () => {
      shippingAddressRepository.findById.mockResolvedValue(
        mockShippingAddress as any,
      );
      shippingAddressRepository.delete.mockResolvedValue(
        mockShippingAddress as any,
      );

      const result = await service.delete(mockShippingAddressId, mockUserId);

      expect(shippingAddressRepository.findById).toHaveBeenCalledWith(
        mockShippingAddressId,
      );
      expect(shippingAddressRepository.delete).toHaveBeenCalledWith(
        mockShippingAddressId,
      );
      expect(result).toEqual(mockShippingAddress);
    });

    it('should throw error if address not found', async () => {
      shippingAddressRepository.findById.mockResolvedValue(null);

      await expect(
        service.delete(mockShippingAddressId, mockUserId),
      ).rejects.toThrow('Shipping address not found');

      expect(shippingAddressRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error if user is not authorized', async () => {
      shippingAddressRepository.findById.mockResolvedValue(
        mockShippingAddress as any,
      );

      await expect(
        service.delete(mockShippingAddressId, 'different-user'),
      ).rejects.toThrow('Shipping address not found');

      expect(shippingAddressRepository.delete).not.toHaveBeenCalled();
    });
  });
});
