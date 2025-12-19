import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateShippingAddressDto,
  UpdateShippingAddressDto,
} from './dto/shipping-address.dto';
import { SHIPPING_ADDRESS_REPOSITORY } from './shipping.constants';
import { IShippingAddressRepository } from './repositories/shipping-address.repository.interface';

@Injectable()
export class ShippingService {
  constructor(
    @Inject(SHIPPING_ADDRESS_REPOSITORY)
    private readonly shippingAddressRepository: IShippingAddressRepository,
  ) {}

  async create(
    userId: string,
    createShippingAddressDto: CreateShippingAddressDto,
  ) {
    // If this is set as default, unset all other default addresses
    if (createShippingAddressDto.isDefault) {
      await this.shippingAddressRepository.updateMany(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    return this.shippingAddressRepository.create({
      ...createShippingAddressDto,
      user: { connect: { id: userId } },
    });
  }

  async findAll(userId: string) {
    return this.shippingAddressRepository.findByUserId(userId);
  }

  async findById(id: string, userId: string) {
    const address = await this.shippingAddressRepository.findById(id);

    if (!address) {
      throw new NotFoundException('Shipping address not found');
    }

    if (address.userId !== userId) {
      throw new NotFoundException('Shipping address not found');
    }

    return address;
  }

  async findDefault(userId: string) {
    const address =
      await this.shippingAddressRepository.findDefaultByUserId(userId);

    if (!address) {
      throw new NotFoundException('No default shipping address found');
    }

    return address;
  }

  async update(
    id: string,
    userId: string,
    updateShippingAddressDto: UpdateShippingAddressDto,
  ) {
    const address = await this.shippingAddressRepository.findById(id);

    if (!address) {
      throw new NotFoundException('Shipping address not found');
    }

    if (address.userId !== userId) {
      throw new NotFoundException('Shipping address not found');
    }

    // If this is set as default, unset all other default addresses
    if (updateShippingAddressDto.isDefault) {
      await this.shippingAddressRepository.updateMany(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    return this.shippingAddressRepository.update(id, updateShippingAddressDto);
  }

  async setAsDefault(id: string, userId: string) {
    const address = await this.shippingAddressRepository.findById(id);

    if (!address) {
      throw new NotFoundException('Shipping address not found');
    }

    if (address.userId !== userId) {
      throw new NotFoundException('Shipping address not found');
    }

    return this.shippingAddressRepository.setAsDefault(id, userId);
  }

  async delete(id: string, userId: string) {
    const address = await this.shippingAddressRepository.findById(id);

    if (!address) {
      throw new NotFoundException('Shipping address not found');
    }

    if (address.userId !== userId) {
      throw new NotFoundException('Shipping address not found');
    }

    return this.shippingAddressRepository.delete(id);
  }
}
