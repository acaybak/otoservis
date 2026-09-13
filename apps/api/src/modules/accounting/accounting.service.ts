import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { Prisma } from '@otoservis/database';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  // === PAYMENTS ===
  async createPayment(tenantId: string, data: {
    customerId: string; amount: number; method: string;
    referenceNo?: string; note?: string; cashRegisterId?: string;
  }, userId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: data.customerId, tenantId } });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı.');

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          tenantId,
          customerId: data.customerId,
          amount: data.amount,
          method: data.method,
          referenceNo: data.referenceNo || null,
          note: data.note || null,
          receivedById: userId,
          cashRegisterId: data.cashRegisterId || null,
        },
      });

      // Update customer account balance
      const account = await tx.customerAccount.findFirst({ where: { customerId: data.customerId } });
      if (account) {
        await tx.accountTransaction.create({
          data: {
            customerAccountId: account.id,
            type: 'PAYMENT',
            amount: -data.amount,
            description: `Ödeme: ${data.method}`,
            referenceId: created.id,
            referenceType: 'Payment',
            createdById: userId,
          },
        });
        await tx.customerAccount.update({
          where: { id: account.id },
          data: { balance: { decrement: data.amount } },
        });
      }

      // Cash register transaction
      if (data.cashRegisterId && data.method === 'CASH') {
        await tx.cashTransaction.create({
          data: {
            cashRegisterId: data.cashRegisterId,
            type: 'IN',
            amount: data.amount,
            description: `Müşteri ödemesi: ${customer.firstName} ${customer.lastName}`,
            referenceId: created.id,
            referenceType: 'Payment',
            userId,
          },
        });
        await tx.cashRegister.update({
          where: { id: data.cashRegisterId },
          data: { balance: { increment: data.amount } },
        });
      }

      return created;
    });

    await this.auditService.log({
      tenantId, userId,
      action: 'PAYMENT_CREATED', entity: 'Payment', entityId: payment.id, newValue: payment,
    });
    return payment;
  }

  async findPayments(tenantId: string, pagination: { skip: number; take: number }, customerId?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, total };
  }

  // === INVOICES ===
  async createInvoice(tenantId: string, data: {
    customerId?: string; issueDate: string; dueDate?: string; notes?: string;
    items: Array<{ serviceOrderId?: string; description: string; quantity: number; unitPrice: number; taxRate: number }>;
  }, userId: string) {
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0);
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number
    const now = new Date();
    const invoiceNumber = `INV${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 9000 + 1000)}`;

    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          tenantId,
          invoiceNumber,
          customerId: data.customerId || null,
          issueDate: new Date(data.issueDate),
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          subtotal,
          taxAmount,
          totalAmount,
          status: 'DRAFT',
          notes: data.notes || null,
        },
      });

      for (const item of data.items) {
        const itemTotal = item.quantity * item.unitPrice;
        await tx.invoiceItem.create({
          data: {
            invoiceId: created.id,
            serviceOrderId: item.serviceOrderId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            total: itemTotal,
          },
        });
      }

      // Debit customer account if customer specified
      if (data.customerId) {
        const account = await tx.customerAccount.findFirst({ where: { customerId: data.customerId } });
        if (account) {
          await tx.accountTransaction.create({
            data: {
              customerAccountId: account.id,
              type: 'DEBIT',
              amount: totalAmount,
              description: `Fatura: ${invoiceNumber}`,
              referenceId: created.id,
              referenceType: 'Invoice',
              createdById: userId,
            },
          });
          await tx.customerAccount.update({
            where: { id: account.id },
            data: { balance: { increment: totalAmount } },
          });
        }
      }

      return tx.invoice.findUnique({
        where: { id: created.id },
        include: { items: true },
      });
    });

    return invoice;
  }

  async findInvoices(tenantId: string, pagination: { skip: number; take: number }, status?: string) {
    const where: Record<string, unknown> = { tenantId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { items: true },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { data, total };
  }

  async updateInvoice(tenantId: string, id: string, data: { status?: string; notes?: string | null }) {
    const existing = await this.prisma.invoice.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Fatura bulunamadı.');
    return this.prisma.invoice.update({ where: { id }, data, include: { items: true } });
  }

  // === CASH REGISTERS ===
  async findCashRegisters(tenantId: string) {
    return this.prisma.cashRegister.findMany({
      where: { tenantId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
  }

  async openCashRegister(tenantId: string, data: { name: string; initialBalance: number }) {
    return this.prisma.cashRegister.create({
      data: { tenantId, name: data.name, balance: data.initialBalance, isActive: true },
    });
  }

  async cashTransaction(tenantId: string, registerId: string, data: {
    type: string; amount: number; description?: string;
  }, userId: string) {
    const register = await this.prisma.cashRegister.findFirst({ where: { id: registerId, tenantId, isActive: true } });
    if (!register) throw new NotFoundException('Kasa bulunamadı veya aktif değil.');

    return this.prisma.$transaction(async (tx) => {
      const tx_ = await tx.cashTransaction.create({
        data: {
          cashRegisterId: registerId,
          type: data.type,
          amount: data.amount,
          description: data.description || null,
          userId,
        },
      });

      await tx.cashRegister.update({
        where: { id: registerId },
        data: {
          balance: data.type === 'IN'
            ? { increment: data.amount }
            : { decrement: data.amount },
        },
      });

      return tx_;
    });
  }

  // === CUSTOMER ACCOUNTS ===
  async findCustomerAccount(tenantId: string, customerId: string) {
    const account = await this.prisma.customerAccount.findFirst({
      where: { customerId, tenantId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 50 } },
    });
    if (!account) throw new NotFoundException('Cari hesabı bulunamadı.');
    return account;
  }
}
