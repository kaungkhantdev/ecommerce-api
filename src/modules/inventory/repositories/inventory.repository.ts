import { PrismaService } from '@/database/prisma.service';
import { GenericRepository } from '@/shared/repositories';
import { Injectable } from '@nestjs/common';
import { Inventory, Prisma } from 'generated/prisma/client';
import { IInventoryRepository } from './inventory.repository.interface';

@Injectable()
export class InventoryRepository
  extends GenericRepository<Inventory>
  implements IInventoryRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, Prisma.ModelName.User);
  }

  async create(data: Prisma.InventoryCreateInput): Promise<Inventory> {
    return await this.prisma.inventory.create({ data });
  }

  async findByProductId(productId: string): Promise<Inventory> {
    return (await this.prisma.inventory.findUnique({
      where: { productId },
    })) as Inventory;
  }

  async updateQuantity(
    productId: string,
    quantity: number,
  ): Promise<Inventory> {
    return await this.prisma.inventory.update({
      where: { productId },
      data: { quantity },
    });
  }

  async reserveStock(productId: string, quantity: number): Promise<Inventory> {
    return await this.prisma.inventory.update({
      where: { productId },
      data: {
        reserved: { increment: quantity },
      },
    });
  }

  async releaseStock(productId: string, quantity: number): Promise<Inventory> {
    return await this.prisma.inventory.update({
      where: { productId },
      data: {
        reserved: { decrement: quantity },
      },
    });
  }
}
