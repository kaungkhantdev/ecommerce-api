import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { Cart, Product } from 'generated/prisma/client';
import { CART_REPOSITORY } from './cart.constants';
import { ICartRepository } from './repositories/cart.repository.interface';
import { PRODUCT_REPOSITORY } from '../products/products.constants';
import { IProductRepository } from '../products/repositories/product.repository.interface';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productsService: IProductRepository,
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartRepository.findByUserId(userId);

    if (!cart) {
      cart = await this.cartRepository.createCart(userId);
    }

    return this.calculateCartTotal(cart);
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const product = (await this.productsService.findById(
      addToCartDto.productId,
    )) as Product;

    let cart = (await this.cartRepository.findByUserId(userId)) as Cart;

    if (!cart) {
      cart = (await this.cartRepository.createCart(userId)) as Cart;
    }

    await this.cartRepository.addItem(
      cart.id,
      addToCartDto.productId,
      addToCartDto.quantity,
      Number(product.price),
    );

    return this.getCart(userId);
  }

  async updateCartItem(
    userId: string,
    productId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart = await this.checkCartExitByUserId(userId);

    if (updateCartItemDto.quantity === 0) {
      await this.cartRepository.removeItem(cart.id, productId);
    } else {
      await this.cartRepository.updateItemQuantity(
        cart.id,
        productId,
        updateCartItemDto.quantity,
      );
    }

    return this.getCart(userId);
  }

  async removeFromCart(userId: string, productId: string) {
    const cart = await this.checkCartExitByUserId(userId);

    await this.cartRepository.removeItem(cart.id, productId);
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.checkCartExitByUserId(userId);

    await this.cartRepository.clearCart(cart.id);
    return this.getCart(userId);
  }

  private calculateCartTotal(cart: any) {
    const subtotal = cart.items.reduce((total: number, item: any) => {
      return total + Number(item.price) * item.quantity;
    }, 0);

    return {
      ...cart,
      subtotal,
      itemCount: cart.items.reduce(
        (count: number, item: any) => count + item.quantity,
        0,
      ),
    };
  }

  private async checkCartExitByUserId(userId: string): Promise<Cart> {
    const cart = (await this.cartRepository.findByUserId(userId)) as Cart;
    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }
}
