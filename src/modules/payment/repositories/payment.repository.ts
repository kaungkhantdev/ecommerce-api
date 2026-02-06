import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GenericRepository } from '@/shared/repositories';
import { Payment, PaymentStatus, Prisma } from 'generated/prisma/client';
import { IPaymentRepository } from './payment.repository.interface';

@Injectable()
export class PaymentRepository
  extends GenericRepository<Payment>
  implements IPaymentRepository
{
  constructor(prisma: PrismaService) {
    super(prisma, Prisma.ModelName.Payment);
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    return await this.model.findUnique({
      where: { orderId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            shippingAddress: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    return await this.model.findFirst({
      where: { transactionId },
      include: {
        order: true,
      },
    });
  }

  async findByProviderPaymentId(
    providerPaymentId: string,
  ): Promise<Payment | null> {
    return await this.model.findFirst({
      where: { providerPaymentId },
      include: {
        order: true,
      },
    });
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    paidAt?: Date,
  ): Promise<Payment> {
    return await this.model.update({
      where: { id },
      data: {
        status,
        ...(paidAt && { paidAt }),
      },
      include: {
        order: true,
      },
    });
  }

  async updateRefund(
    id: string,
    refundedAmount: number,
    status: PaymentStatus,
  ): Promise<Payment> {
    return await this.model.update({
      where: { id },
      data: {
        refundedAmount,
        status,
        refundedAt: new Date(),
      },
      include: {
        order: true,
      },
    });
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    return await this.model.findMany({
      where: { status },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
