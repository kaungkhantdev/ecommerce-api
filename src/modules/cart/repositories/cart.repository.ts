import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GenericRepository } from '@/shared/repositories';
import { ICartRepository } from './cart.repository.interface';
import { Cart, Prisma } from 'generated/prisma/client';

@Injectable()
export class CartRepository
  extends GenericRepository<Cart>
  implements ICartRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, Prisma.ModelName.Cart);
  }

  // Only custom methods - all CRUD inherited!

  async findByUserId(userId: string) {
    return this.model.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });
  }

  async createCart(userId: string) {
    return this.model.create({
      data: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async addItem(
    cartId: string,
    productId: string,
    quantity: number,
    price: number,
  ) {
    return await this.prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        cartId,
        productId,
        quantity,
        price,
      },
      include: {
        product: true,
      },
    });
  }

  async updateItemQuantity(
    cartId: string,
    productId: string,
    quantity: number,
  ) {
    return await this.prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
      data: { quantity },
    });
  }

  async removeItem(cartId: string, productId: string) {
    return await this.prisma.cartItem.delete({
      where: {
        cartId_productId: {
          cartId,
          productId,
        },
      },
    });
  }

  async clearCart(cartId: string) {
    return await this.prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }
}
