import { IsString, IsOptional, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Order ID to create payment for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  orderId: string;

  @ApiProperty({
    description: 'Success URL to redirect after successful payment',
    example: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
  })
  @IsString()
  successUrl: string;

  @ApiProperty({
    description: 'Cancel URL to redirect if payment is cancelled',
    example: 'https://example.com/cancel',
  })
  @IsString()
  cancelUrl: string;

  @ApiProperty({
    description: 'Customer IP address (optional)',
    example: '192.168.1.1',
    required: false,
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;
}

export class RefundPaymentDto {
  @ApiProperty({
    description: 'Amount to refund (optional, defaults to full amount)',
    example: 50,
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiProperty({
    description: 'Reason for refund (optional)',
    example: 'Customer requested refund',
    required: false,
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class WebhookEventDto {
  @ApiProperty({
    description: 'Stripe signature header',
  })
  @IsString()
  signature: string;

  @ApiProperty({
    description: 'Raw webhook payload',
  })
  payload: any;
}

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Checkout session ID',
    example: 'cs_test_a1b2c3d4e5f6',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Checkout session URL',
    example: 'https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5f6',
  })
  url: string;
}
