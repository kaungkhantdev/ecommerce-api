import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { SHIPPING_ADDRESS_REPOSITORY } from './shipping.constants';
import { ShippingAddressRepository } from './repositories/shipping-address.repository';

@Module({
  controllers: [ShippingController],
  providers: [
    ShippingService,
    {
      provide: SHIPPING_ADDRESS_REPOSITORY,
      useClass: ShippingAddressRepository,
    },
  ],
  exports: [ShippingService, SHIPPING_ADDRESS_REPOSITORY],
})
export class ShippingModule {}
