import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import {
  CreateCheckoutSessionDto,
  PaymentResponseDto,
  RefundPaymentDto,
} from './dto/payment.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StripeService } from './stripe.service';
import { Request } from 'express';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('checkout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create Stripe checkout session for an order' })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or payment already completed',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createCheckoutSession(
    @CurrentUser('id') userId: string,
    @Body() createCheckoutSessionDto: CreateCheckoutSessionDto,
  ) {
    return this.paymentService.createCheckoutSession(
      userId,
      createCheckoutSessionDto,
    );
  }

  @Get('order/:orderId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get payment details for an order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Order or payment not found' })
  async getPaymentByOrderId(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentService.getPaymentByOrderId(orderId, userId);
  }

  @Post('refund/:orderId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Refund a payment for an order (full or partial)' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Refund processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Only completed payments can be refunded',
  })
  @ApiResponse({ status: 404, description: 'Order or payment not found' })
  async refundPayment(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
    @Body() refundPaymentDto?: RefundPaymentDto,
  ) {
    return this.paymentService.refundPayment(
      orderId,
      userId,
      refundPaymentDto?.amount,
      refundPaymentDto?.reason,
    );
  }

  @Post('webhook')
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const payload = request.rawBody;

    if (!payload) {
      throw new Error('No payload received');
    }

    // Construct and verify the event
    const event = await this.stripeService.constructWebhookEvent(
      payload,
      signature,
    );

    // Handle the event
    return this.paymentService.handleWebhookEvent(event);
  }
}
