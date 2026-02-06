import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GenericRepository } from '@/shared/repositories';
import { Order, OrderStatus, Prisma } from 'generated/prisma/client';
import { IOrderRepository } from './order.repository.interface';

@Injectable()
export class OrderRepository
  extends GenericRepository<Order>
  implements IOrderRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, Prisma.ModelName.Order);
  }

  async findByUserId(userId: string): Promise<Order[]> {
    return await this.model.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return await this.model.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        payment: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async findByUserIdAndId(
    userId: string,
    orderId: string,
  ): Promise<Order | null> {
    return await this.model.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        payment: true,
      },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return await this.model.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        payment: true,
      },
    });
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return await this.model.findMany({
      where: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
        payment: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
