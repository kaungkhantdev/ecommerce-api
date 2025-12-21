import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import { ORDER_REPOSITORY } from './orders.constants';
import { IOrderRepository } from './repositories/order.repository.interface';
import { PRODUCT_REPOSITORY } from '../products/products.constants';
import { IProductRepository } from '../products/repositories/product.repository.interface';
import { SHIPPING_ADDRESS_REPOSITORY } from '../shipping/shipping.constants';
import { IShippingAddressRepository } from '../shipping/repositories/shipping-address.repository.interface';
import { CART_REPOSITORY } from '../cart/cart.constants';
import { ICartRepository } from '../cart/repositories/cart.repository.interface';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus } from 'generated/prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(SHIPPING_ADDRESS_REPOSITORY)
    private readonly shippingAddressRepository: IShippingAddressRepository,
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    // Validate shipping address exists and belongs to user
    const shippingAddress = await this.shippingAddressRepository.findById(
      createOrderDto.shippingAddressId,
    );

    if (!shippingAddress || shippingAddress.userId !== userId) {
      throw new NotFoundException('Shipping address not found');
    }

    // Validate products and calculate totals
    let subtotal = 0;
    const orderItems: Array<{
      productId: string;
      quantity: number;
      price: any;
      total: number;
    }> = [];

    for (const item of createOrderDto.items) {
      const product = await this.productRepository.findById(item.productId);

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} not found`,
        );
      }

      if (!product.isActive) {
        throw new BadRequestException(
          `Product "${product.name}" is not available`,
        );
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    // Calculate tax and shipping (you can customize these calculations)
    const taxRate = 0.1; // 10% tax
    const tax = subtotal * taxRate;
    const shippingCost = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shippingCost;

    // Generate unique order number
    const orderNumber = this.generateOrderNumber();

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          orderNumber,
          status: OrderStatus.PENDING,
          subtotal,
          shippingCost,
          tax,
          total,
          shippingAddressId: createOrderDto.shippingAddressId,
          notes: createOrderDto.notes,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          shippingAddress: true,
        },
      });

      // Clear user's cart after successful order creation
      const cart = await this.cartRepository.findByUserId(userId);
      if (cart) {
        await this.cartRepository.clearCart(cart.id);
      }

      return newOrder;
    });

    return order;
  }

  async findAll(userId: string) {
    return this.orderRepository.findByUserId(userId);
  }

  async findById(id: string, userId: string) {
    const order = await this.orderRepository.findByUserIdAndId(userId, id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async findByOrderNumber(orderNumber: string, userId: string) {
    const order = await this.orderRepository.findByOrderNumber(orderNumber);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, userId: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.orderRepository.findByUserIdAndId(userId, id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only allow updates for pending orders
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be modified');
    }

    // Validate shipping address if provided
    if (updateOrderDto.shippingAddressId) {
      const shippingAddress = await this.shippingAddressRepository.findById(
        updateOrderDto.shippingAddressId,
      );

      if (!shippingAddress || shippingAddress.userId !== userId) {
        throw new NotFoundException('Shipping address not found');
      }
    }

    return this.orderRepository.update(id, updateOrderDto);
  }

  async updateStatus(
    id: string,
    userId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const order = await this.orderRepository.findByUserIdAndId(userId, id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.orderRepository.updateStatus(id, updateOrderStatusDto.status);
  }

  async cancel(id: string, userId: string) {
    const order = await this.orderRepository.findByUserIdAndId(userId, id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only allow cancellation for pending or processing orders
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PROCESSING
    ) {
      throw new BadRequestException(
        'Only pending or processing orders can be cancelled',
      );
    }

    return this.orderRepository.updateStatus(id, OrderStatus.CANCELLED);
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }
}
