import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRepository } from './repositories/cart.repository';
import { ProductsModule } from '../products/products.module';
import { CART_REPOSITORY } from './cart.constants';
import { PRODUCT_REPOSITORY } from '../products/products.constants';
import { ProductRepository } from '../products/repositories/product.repository';

@Module({
  imports: [ProductsModule],
  controllers: [CartController],
  providers: [
    CartService,
    {
      provide: CART_REPOSITORY,
      useClass: CartRepository,
    },
    {
      provide: PRODUCT_REPOSITORY,
      useClass: ProductRepository,
    },
  ],
  exports: [CartService],
})
export class CartModule {}
