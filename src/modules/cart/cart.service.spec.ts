import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { ICartRepository } from './repositories/cart.repository.interface';
import { IProductRepository } from '../products/repositories/product.repository.interface';
import { CART_REPOSITORY } from './cart.constants';
import { PRODUCT_REPOSITORY } from '../products/products.constants';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import {
  mockCart,
  mockCartId,
  mockEmptyCart,
  mockProduct,
  mockProductId,
  mockUserId,
} from '../../../test/fixtures/cart.fixture';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: jest.Mocked<ICartRepository>;
  let productRepository: jest.Mocked<IProductRepository>;

  beforeEach(async () => {
    const mockCartRepository = {
      findByUserId: jest.fn(),
      createCart: jest.fn(),
      addItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      removeItem: jest.fn(),
      clearCart: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockProductRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findFeatured: jest.fn(),
      searchByName: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CART_REPOSITORY,
          useValue: mockCartRepository,
        },
        {
          provide: PRODUCT_REPOSITORY,
          useValue: mockProductRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get(CART_REPOSITORY);
    productRepository = module.get(PRODUCT_REPOSITORY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCart', () => {
    it('should return existing cart with calculated totals', async () => {
      cartRepository.findByUserId.mockResolvedValue(mockCart);

      const result = await service.getCart(mockUserId);

      expect(cartRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        ...mockCart,
        subtotal: 200,
        itemCount: 2,
      });
    });

    it('should create a new cart if none exists', async () => {
      cartRepository.findByUserId.mockResolvedValue(null);
      cartRepository.createCart.mockResolvedValue(mockEmptyCart);

      const result = await service.getCart(mockUserId);

      expect(cartRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(cartRepository.createCart).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual({
        ...mockEmptyCart,
        subtotal: 0,
        itemCount: 0,
      });
    });

    it('should calculate correct subtotal for multiple items', async () => {
      const cartWithMultipleItems = {
        ...mockCart,
        items: [
          {
            id: 'item-1',
            cartId: mockCartId,
            productId: 'prod-1',
            quantity: 2,
            price: 100,
          },
          {
            id: 'item-2',
            cartId: mockCartId,
            productId: 'prod-2',
            quantity: 3,
            price: 50,
          },
        ],
      };
      cartRepository.findByUserId.mockResolvedValue(cartWithMultipleItems);

      const result = await service.getCart(mockUserId);

      expect(result.subtotal).toBe(350);
      expect(result.itemCount).toBe(5);
    });
  });

  describe('addToCart', () => {
    const addToCartDto: AddToCartDto = {
      productId: mockProductId,
      quantity: 2,
    };

    it('should add item to existing cart', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      cartRepository.findByUserId.mockResolvedValueOnce(mockCart);
      cartRepository.addItem.mockResolvedValue(undefined);
      cartRepository.findByUserId.mockResolvedValueOnce(mockCart);

      const result = await service.addToCart(mockUserId, addToCartDto);

      expect(productRepository.findById).toHaveBeenCalledWith(mockProductId);
      expect(cartRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(cartRepository.addItem).toHaveBeenCalledWith(
        mockCartId,
        mockProductId,
        2,
        100,
      );
      expect(result).toEqual({
        ...mockCart,
        subtotal: 200,
        itemCount: 2,
      });
    });

    it('should create cart and add item if cart does not exist', async () => {
      productRepository.findById.mockResolvedValue(mockProduct);
      cartRepository.findByUserId.mockResolvedValueOnce(null);
      cartRepository.createCart.mockResolvedValue(mockEmptyCart);
      cartRepository.addItem.mockResolvedValue(undefined);
      cartRepository.findByUserId.mockResolvedValueOnce(mockCart);

      const result = await service.addToCart(mockUserId, addToCartDto);

      expect(cartRepository.createCart).toHaveBeenCalledWith(mockUserId);
      expect(cartRepository.addItem).toHaveBeenCalledWith(
        mockCartId,
        mockProductId,
        2,
        100,
      );
      expect(result).toBeDefined();
    });
  });

  describe('updateCartItem', () => {
    const updateCartItemDto: UpdateCartItemDto = {
      quantity: 5,
    };

    it('should update cart item quantity', async () => {
      cartRepository.findByUserId.mockResolvedValueOnce(mockCart);
      cartRepository.updateItemQuantity.mockResolvedValue(undefined);
      cartRepository.findByUserId.mockResolvedValueOnce(mockCart);

      const result = await service.updateCartItem(
        mockUserId,
        mockProductId,
        updateCartItemDto,
      );

      expect(cartRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(cartRepository.updateItemQuantity).toHaveBeenCalledWith(
        mockCartId,
        mockProductId,
        5,
      );
      expect(result).toBeDefined();
    });

    it('should remove item when quantity is 0', async () => {
      const removeDto: UpdateCartItemDto = { quantity: 0 };
      cartRepository.findByUserId.mockResolvedValueOnce(mockCart);
      cartRepository.removeItem.mockResolvedValue(undefined);
      cartRepository.findByUserId.mockResolvedValueOnce(mockEmptyCart);

      const result = await service.updateCartItem(
        mockUserId,
        mockProductId,
        removeDto,
      );

      expect(cartRepository.removeItem).toHaveBeenCalledWith(
        mockCartId,
        mockProductId,
      );
      expect(cartRepository.updateItemQuantity).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      cartRepository.findByUserId.mockResolvedValue(null);

      await expect(
        service.updateCartItem(mockUserId, mockProductId, updateCartItemDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      cartRepository.findByUserId.mockResolvedValueOnce(mockCart);
      cartRepository.removeItem.mockResolvedValue(undefined);
      cartRepository.findByUserId.mockResolvedValueOnce(mockEmptyCart);

      const result = await service.removeFromCart(mockUserId, mockProductId);

      expect(cartRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(cartRepository.removeItem).toHaveBeenCalledWith(
        mockCartId,
        mockProductId,
      );
      expect(result).toEqual({
        ...mockEmptyCart,
        subtotal: 0,
        itemCount: 0,
      });
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      cartRepository.findByUserId.mockResolvedValue(null);

      await expect(
        service.removeFromCart(mockUserId, mockProductId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      cartRepository.findByUserId.mockResolvedValueOnce(mockCart);
      cartRepository.clearCart.mockResolvedValue(undefined);
      cartRepository.findByUserId.mockResolvedValueOnce(mockEmptyCart);

      const result = await service.clearCart(mockUserId);

      expect(cartRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
      expect(cartRepository.clearCart).toHaveBeenCalledWith(mockCartId);
      expect(result).toEqual({
        ...mockEmptyCart,
        subtotal: 0,
        itemCount: 0,
      });
    });

    it('should throw NotFoundException if cart does not exist', async () => {
      cartRepository.findByUserId.mockResolvedValue(null);

      await expect(service.clearCart(mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
