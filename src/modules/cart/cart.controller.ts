import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user cart',
    description: 'Returns the current user shopping cart with all items',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated',
  })
  async getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @ApiOperation({
    summary: 'Add product to cart',
    description:
      'Adds a product to the user shopping cart or updates quantity if already exists',
  })
  @ApiResponse({
    status: 201,
    description: 'Product added to cart successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid product ID or quantity',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated',
  })
  async addToCart(
    @CurrentUser('id') userId: string,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Put('items/:productId')
  @ApiOperation({
    summary: 'Update cart item quantity',
    description: 'Updates the quantity of a specific product in the cart',
  })
  @ApiParam({
    name: 'productId',
    type: String,
    description: 'Product unique identifier',
    example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart item updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid product ID or quantity',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated',
  })
  async updateCartItem(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(
      userId,
      productId,
      updateCartItemDto,
    );
  }

  @Delete('items/:productId')
  @ApiOperation({
    summary: 'Remove product from cart',
    description: 'Removes a specific product from the user shopping cart',
  })
  @ApiParam({
    name: 'productId',
    type: String,
    description: 'Product unique identifier',
    example: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  })
  @ApiResponse({
    status: 200,
    description: 'Product removed from cart successfully',
  })
  @ApiBadRequestResponse({
    description: 'Product not found in cart',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated',
  })
  async removeFromCart(
    @CurrentUser('id') userId: string,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeFromCart(userId, productId);
  }

  @Delete()
  @ApiOperation({
    summary: 'Clear cart',
    description: 'Removes all items from the user shopping cart',
  })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'User is not authenticated',
  })
  async clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
