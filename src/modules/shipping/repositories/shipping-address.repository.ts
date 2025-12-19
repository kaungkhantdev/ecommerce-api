import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GenericRepository } from '@/shared/repositories';
import { ShippingAddress, Prisma } from 'generated/prisma/client';
import { IShippingAddressRepository } from './shipping-address.repository.interface';

@Injectable()
export class ShippingAddressRepository
  extends GenericRepository<ShippingAddress>
  implements IShippingAddressRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, Prisma.ModelName.ShippingAddress);
  }

  async findByUserId(userId: string): Promise<ShippingAddress[]> {
    return (await this.model.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })) as ShippingAddress[];
  }

  async findDefaultByUserId(userId: string): Promise<ShippingAddress | null> {
    return (await this.model.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    })) as ShippingAddress | null;
  }

  async setAsDefault(id: string, userId: string): Promise<ShippingAddress> {
    // First, unset all default addresses for this user
    await this.model.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    // Then set the specified address as default
    return (await this.model.update({
      where: { id },
      data: { isDefault: true },
    })) as ShippingAddress;
  }
}
