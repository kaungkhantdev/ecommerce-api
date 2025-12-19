import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import {
  CreateShippingAddressDto,
  UpdateShippingAddressDto,
} from './dto/shipping-address.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Shipping')
@ApiBearerAuth('JWT-auth')
@Controller('shipping/addresses')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new shipping address' })
  @ApiResponse({
    status: 201,
    description: 'Shipping address created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createShippingAddressDto: CreateShippingAddressDto,
  ) {
    return this.shippingService.create(userId, createShippingAddressDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all shipping addresses for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Shipping addresses retrieved successfully',
  })
  async findAll(@CurrentUser('id') userId: string) {
    return this.shippingService.findAll(userId);
  }

  @Get('default')
  @ApiOperation({
    summary: 'Get default shipping address for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Default shipping address retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'No default shipping address found',
  })
  async findDefault(@CurrentUser('id') userId: string) {
    return this.shippingService.findDefault(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a shipping address by ID' })
  @ApiResponse({
    status: 200,
    description: 'Shipping address retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  async findById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.shippingService.findById(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a shipping address' })
  @ApiResponse({
    status: 200,
    description: 'Shipping address updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateShippingAddressDto: UpdateShippingAddressDto,
  ) {
    return this.shippingService.update(id, userId, updateShippingAddressDto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set a shipping address as default' })
  @ApiResponse({
    status: 200,
    description: 'Shipping address set as default successfully',
  })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  async setAsDefault(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.shippingService.setAsDefault(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shipping address' })
  @ApiResponse({
    status: 200,
    description: 'Shipping address deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Shipping address not found' })
  async delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.shippingService.delete(id, userId);
    return { message: 'Shipping address deleted successfully' };
  }
}
