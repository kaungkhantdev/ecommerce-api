import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { INVENTORY_REPOSITORY } from './inventory.constants';
import { InventoryRepository } from './repositories/inventory.repository';

@Module({
  providers: [
    InventoryService,
    {
      provide: INVENTORY_REPOSITORY,
      useClass: InventoryRepository,
    },
  ],
  exports: [InventoryService],
})
export class InventoryModule {}
