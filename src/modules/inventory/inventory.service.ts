import { Inject, Injectable } from '@nestjs/common';
import { INVENTORY_REPOSITORY } from './inventory.constants';
import { IInventoryRepository } from './repositories/inventory.repository.interface';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepository: IInventoryRepository,
  ) {}

  async getInventory(productId: string) {
    return this.inventoryRepository.findByProductId(productId);
  }

  async updateQuantity(productId: string, quantity: number) {
    return this.inventoryRepository.updateQuantity(productId, quantity);
  }

  async checkAvailability(
    productId: string,
    requestedQuantity: number,
  ): Promise<boolean> {
    const inventory = await this.inventoryRepository.findByProductId(productId);

    if (!inventory) {
      return false;
    }

    const available = inventory.quantity - inventory.reserved;
    return available >= requestedQuantity;
  }
}
