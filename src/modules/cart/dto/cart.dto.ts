import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product unique identifier to add to cart',
    example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product to add',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity for the cart item (0 to remove)',
    example: 3,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;
}
