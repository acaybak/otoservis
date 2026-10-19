import { z } from 'zod';

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid('Geçerli bir fatura ID giriniz.'),
  amount: z.number().positive('Tutar pozitif olmalıdır.'),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'CHECK']),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  serviceOrderId: z.string().uuid().optional(),
  issueDate: z.string().min(1, 'Fatura tarihi zorunludur.'),
  dueDate: z.string().min(1, 'Son ödeme tarihi zorunludur.'),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
  })).min(1, 'En az bir kalem eklenmelidir.'),
});

export const updateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']).optional(),
  notes: z.string().nullable().optional(),
});

export const cashRegisterOpenSchema = z.object({
  name: z.string().min(1, 'Kasa adı zorunludur.').max(100),
  initialBalance: z.number().min(0).default(0),
});

export const cashTransactionSchema = z.object({
  type: z.enum(['IN', 'OUT']),
  amount: z.number().positive('Tutar pozitif olmalıdır.'),
  description: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
});

export const accountTransactionSchema = z.object({
  type: z.enum(['SERVICE', 'PAYMENT', 'REFUND', 'DISCOUNT', 'DEBIT', 'CREDIT', 'ADJUSTMENT']),
  amount: z.number().positive(),
  description: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
});

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;
export type CashRegisterOpenDto = z.infer<typeof cashRegisterOpenSchema>;
export type CashTransactionDto = z.infer<typeof cashTransactionSchema>;
export type AccountTransactionDto = z.infer<typeof accountTransactionSchema>;
