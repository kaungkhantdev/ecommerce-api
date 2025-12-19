import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

/**
 * Service responsible for building Stripe checkout line items
 * Follows Single Responsibility Principle (SRP)
 */
@Injectable()
export class LineItemBuilderService {
  private readonly CURRENCY = 'usd';

  /**
   * Builds Stripe line items from order data
   */
  buildLineItems(
    orderData: any,
  ): Stripe.Checkout.SessionCreateParams.LineItem[] {
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Add product line items
    lineItems.push(...this.buildProductLineItems(orderData.items));

    // Add shipping if applicable
    if (Number(orderData.shippingCost) > 0) {
      lineItems.push(
        this.buildShippingLineItem(Number(orderData.shippingCost)),
      );
    }

    // Add tax if applicable
    if (Number(orderData.tax) > 0) {
      lineItems.push(this.buildTaxLineItem(Number(orderData.tax)));
    }

    return lineItems;
  }

  /**
   * Converts amount to cents for Stripe API
   */
  private toCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Builds line items for products
   */
  private buildProductLineItems(
    items: any[],
  ): Stripe.Checkout.SessionCreateParams.LineItem[] {
    return items.map((item) => ({
      price_data: {
        currency: this.CURRENCY,
        product_data: {
          name: item.product.name,
          description: item.product.description || undefined,
          images: this.getProductImages(item.product),
        },
        unit_amount: this.toCents(Number(item.price)),
      },
      quantity: item.quantity,
    }));
  }

  /**
   * Builds shipping line item
   */
  private buildShippingLineItem(
    amount: number,
  ): Stripe.Checkout.SessionCreateParams.LineItem {
    return {
      price_data: {
        currency: this.CURRENCY,
        product_data: {
          name: 'Shipping',
        },
        unit_amount: this.toCents(amount),
      },
      quantity: 1,
    };
  }

  /**
   * Builds tax line item
   */
  private buildTaxLineItem(
    amount: number,
  ): Stripe.Checkout.SessionCreateParams.LineItem {
    return {
      price_data: {
        currency: this.CURRENCY,
        product_data: {
          name: 'Tax',
        },
        unit_amount: this.toCents(amount),
      },
      quantity: 1,
    };
  }

  /**
   * Extracts product images
   */
  private getProductImages(product: any): string[] | undefined {
    if (product.images?.length > 0) {
      return [product.images[0].url];
    }
    return undefined;
  }
}
