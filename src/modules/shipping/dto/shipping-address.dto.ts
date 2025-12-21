import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShippingAddressDto {
  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Address line 1',
    example: '123 Main Street',
  })
  @IsString()
  address1: string;

  @ApiProperty({
    description: 'Address line 2',
    example: 'Apt 4B',
    required: false,
  })
  @IsString()
  @IsOptional()
  address2?: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State',
    example: 'NY',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'Postal code',
    example: '10001',
  })
  @IsString()
  postalCode: string;

  @ApiProperty({
    description: 'Country',
    example: 'USA',
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Set as default shipping address',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateShippingAddressDto {
  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: false,
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({
    description: 'Address line 1',
    example: '123 Main Street',
    required: false,
  })
  @IsString()
  @IsOptional()
  address1?: string;

  @ApiProperty({
    description: 'Address line 2',
    example: 'Apt 4B',
    required: false,
  })
  @IsString()
  @IsOptional()
  address2?: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'State',
    example: 'NY',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'Postal code',
    example: '10001',
    required: false,
  })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({
    description: 'Country',
    example: 'USA',
    required: false,
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Set as default shipping address',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
