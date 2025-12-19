import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ORDER_REPOSITORY } from './orders.constants';
import { OrderRepository } from './repositories/order.repository';
import { ProductsModule } from '../products/products.module';
import { ShippingModule } from '../shipping/shipping.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [ProductsModule, ShippingModule, CartModule],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepository,
    },
  ],
  exports: [OrdersService, ORDER_REPOSITORY],
})
export class OrdersModule {}
