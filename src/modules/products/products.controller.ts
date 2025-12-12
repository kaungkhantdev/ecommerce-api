import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  FilterProductDto,
} from './dto/product.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RolesGuard } from '@/common/guards/role.guard';
import { UserRole } from 'generated/prisma/enums';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all products',
    description: 'Returns a paginated and filtered list of products',
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
  })
  async findAll(@Query() filterDto: FilterProductDto) {
    return this.productsService.findAll(filterDto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Returns a specific product by its unique identifier',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product unique identifier',
    example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
  })
  @ApiBadRequestResponse({
    description: 'Product not found',
  })
  async findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get product by slug',
    description: 'Returns a specific product by its URL slug',
  })
  @ApiParam({
    name: 'slug',
    type: String,
    description: 'Product URL slug',
    example: 'premium-wireless-headphones',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
  })
  @ApiBadRequestResponse({
    description: 'Product not found',
  })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create new product (Admin/Vendor only)',
    description: 'Creates a new product. Requires ADMIN or VENDOR role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have ADMIN or VENDOR role',
  })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update product (Admin/Vendor only)',
    description: 'Updates an existing product. Requires ADMIN or VENDOR role.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product unique identifier',
    example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or product not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have ADMIN or VENDOR role',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete product (Admin/Vendor only)',
    description: 'Deletes a product. Requires ADMIN or VENDOR role.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Product unique identifier',
    example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Product not found',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated',
  })
  @ApiForbiddenResponse({
    description: 'User does not have ADMIN or VENDOR role',
  })
  async delete(@Param('id') id: string) {
    await this.productsService.delete(id);
    return { message: 'Product deleted successfully' };
  }
}
