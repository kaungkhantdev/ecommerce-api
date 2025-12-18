# Stripe Payment Integration Setup Guide

This guide explains how to set up and use the Stripe payment integration with pre-built checkout in your ecommerce API.

## Prerequisites

1. A Stripe account (create one at https://stripe.com)
2. Stripe API keys (Secret Key and Webhook Secret)

## Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Getting Your Stripe Keys

1. **Secret Key**:
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy the "Secret key" (starts with `sk_test_` for test mode)

2. **Webhook Secret**:
   - Go to https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - Enter your webhook URL: `https://your-domain.com/payment/webhook`
   - Select events to listen to:
     - `checkout.session.completed`
     - `checkout.session.expired`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Click "Add endpoint"
   - Copy the "Signing secret" (starts with `whsec_`)

## API Endpoints

### 1. Create Checkout Session

Creates a Stripe checkout session for an order.

**Endpoint**: `POST /payment/checkout`

**Headers**:
- `Authorization: Bearer <jwt_token>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "orderId": "order-uuid",
  "successUrl": "https://your-app.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://your-app.com/cancel"
}
```

**Response**:
```json
{
  "sessionId": "cs_test_a1b2c3d4e5f6",
  "url": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3d4e5f6..."
}
```

**Usage**:
After receiving the response, redirect the user to the `url` to complete payment.

### 2. Get Payment Details

Get payment information for an order.

**Endpoint**: `GET /payment/order/:orderId`

**Headers**:
- `Authorization: Bearer <jwt_token>`

**Response**:
```json
{
  "id": "payment-uuid",
  "orderId": "order-uuid",
  "amount": "99.99",
  "currency": "USD",
  "method": "STRIPE",
  "status": "COMPLETED",
  "transactionId": "cs_test_a1b2c3d4e5f6",
  "providerPaymentId": "pi_1234567890",
  "refundedAmount": "0.00",
  "paidAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 3. Refund Payment (Full or Partial)

Process a full or partial refund for a completed payment.

**Endpoint**: `POST /payment/refund/:orderId`

**Headers**:
- `Authorization: Bearer <jwt_token>`
- `Content-Type: application/json`

**Request Body** (optional):
```json
{
  "amount": 50.00,
  "reason": "Customer requested partial refund"
}
```

Note: If `amount` is not provided, a full refund will be processed.

**Response**:
```json
{
  "message": "Partial refund processed successfully",
  "refundedAmount": 50.00,
  "totalRefunded": 50.00,
  "refundId": "re_1234567890"
}
```

### 4. Webhook Handler

Receives Stripe webhook events (no authentication required).

**Endpoint**: `POST /payment/webhook`

**Headers**:
- `stripe-signature: <stripe_signature>`

This endpoint is called automatically by Stripe when payment events occur.

## Payment Flow

### Complete Payment Flow:

1. **Create Order**:
   ```bash
   POST /orders
   {
     "shippingAddressId": "address-uuid",
     "items": [
       {
         "productId": "product-uuid",
         "quantity": 2
       }
     ]
   }
   ```

   Returns: `{ "id": "order-uuid", ... }`

2. **Create Checkout Session**:
   ```bash
   POST /payment/checkout
   {
     "orderId": "order-uuid",
     "successUrl": "https://your-app.com/success?session_id={CHECKOUT_SESSION_ID}",
     "cancelUrl": "https://your-app.com/cancel"
   }
   ```

   Returns: `{ "sessionId": "...", "url": "https://checkout.stripe.com/..." }`

3. **Redirect User**:
   - Redirect user to the `url` from step 2
   - User completes payment on Stripe's hosted checkout page

4. **Webhook Processing** (automatic):
   - Stripe sends webhook event to `/payment/webhook`
   - Payment status updated to `COMPLETED`
   - Order status updated to `PROCESSING`

5. **Success Redirect**:
   - User is redirected to your `successUrl`
   - You can verify payment status by calling `GET /payment/order/:orderId`

## Payment Statuses

- `PENDING`: Payment created but not yet completed
- `PROCESSING`: Payment is being processed
- `COMPLETED`: Payment successful (can be partially refunded)
- `FAILED`: Payment failed or session expired
- `REFUNDED`: Payment fully refunded
- `PARTIALLY_REFUNDED`: Payment partially refunded (status remains `COMPLETED`)
- `CANCELLED`: Payment session cancelled or expired

## Order Status Transitions

After successful payment:
- Order status changes from `PENDING` → `PROCESSING`

After full refund:
- Order status changes to `REFUNDED`
- Payment status changes to `REFUNDED`

After partial refund:
- Order status remains `PROCESSING` (or current status)
- Payment status remains `COMPLETED`
- `refundedAmount` field is updated

## Testing

Use Stripe's test cards to test payments:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC can be used.

## Webhook Testing (Local Development)

For local development, use Stripe CLI to forward webhooks:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/payment/webhook
   ```

4. Copy the webhook signing secret and update your `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Features

- ✅ Pre-built Stripe Checkout (hosted payment page)
- ✅ Automatic order status updates via webhooks
- ✅ Support for multiple line items with product details
- ✅ Automatic tax and shipping cost calculation
- ✅ Payment refund support
- ✅ Secure webhook signature verification
- ✅ Product images in checkout (if available)
- ✅ Customer email pre-filled

## Security Notes

1. Never expose your `STRIPE_SECRET_KEY` in client-side code
2. Always verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
3. The webhook endpoint (`/payment/webhook`) does not require authentication as it's validated by Stripe's signature
4. All other payment endpoints require JWT authentication

## Currency

Currently configured for USD. To change currency, update:
- `src/modules/payment/payment.service.ts` (lines with `currency: 'usd'`)
- `src/modules/payment/stripe.service.ts` (if currency settings are added)

## Support

For Stripe-specific issues, consult:
- Stripe Documentation: https://stripe.com/docs
- Stripe API Reference: https://stripe.com/docs/api
- Stripe Checkout: https://stripe.com/docs/payments/checkout
