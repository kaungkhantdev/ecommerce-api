import { IsUUID, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Product unique identifier',
    example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review title',
    example: 'Great product!',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Review comment',
    example: 'This product exceeded my expectations. Highly recommended!',
  })
  @IsString()
  comment: string;
}

export class UpdateReviewDto {
  @ApiProperty({
    description: 'Rating from 1 to 5',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review title',
    example: 'Updated review title',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Review comment',
    example: 'Updated my review after using it for a while.',
  })
  @IsString()
  comment: string;
}
