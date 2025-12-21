import { IRepository } from '@/shared/repositories';
import { Payment, PaymentStatus } from 'generated/prisma/client';

/**
 * Payment-specific repository interface
 * Extends generic IRepository and adds domain-specific methods
 */
export interface IPaymentRepository extends IRepository<Payment> {
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByTransactionId(transactionId: string): Promise<Payment | null>;
  findByProviderPaymentId(providerPaymentId: string): Promise<Payment | null>;
  updateStatus(
    id: string,
    status: PaymentStatus,
    paidAt?: Date,
  ): Promise<Payment>;
  updateRefund(
    id: string,
    refundedAmount: number,
    status: PaymentStatus,
  ): Promise<Payment>;
  findByStatus(status: PaymentStatus): Promise<Payment[]>;
}
