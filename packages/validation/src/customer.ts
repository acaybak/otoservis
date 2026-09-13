import { z } from 'zod';

export const createCustomerSchema = z.object({
  firstName: z.string().min(1, 'Ad zorunludur.').max(100),
  lastName: z.string().min(1, 'Soyad zorunludur.').max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  tcNo: z.string().max(11).optional(),
  notes: z.string().optional(),
  addresses: z.array(z.object({
    type: z.enum(['HOME', 'WORK', 'BILLING', 'SHIPPING']).default('HOME'),
    address: z.string().min(1),
    city: z.string().optional(),
    district: z.string().optional(),
    postalCode: z.string().optional(),
  })).optional(),
  contacts: z.array(z.object({
    type: z.enum(['PHONE', 'EMAIL', 'WHATSAPP']).default('PHONE'),
    value: z.string().min(1),
  })).optional(),
});

export const updateCustomerSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  tcNo: z.string().max(11).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const customerSearchSchema = z.object({
  q: z.string().min(1).optional(),
  phone: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type CustomerSearchDto = z.infer<typeof customerSearchSchema>;
