import { z } from 'zod';

export const createServiceOrderSchema = z.object({
  customerId: z.string().uuid('Geçerli bir müşteri ID giriniz.'),
  vehicleId: z.string().uuid('Geçerli bir araç ID giriniz.'),
  km: z.number().int().min(0).optional(),
  customerComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  plannedWork: z.string().optional(),
  assignedToId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const updateServiceOrderSchema = z.object({
  km: z.number().int().min(0).nullable().optional(),
  customerComplaint: z.string().nullable().optional(),
  diagnosis: z.string().nullable().optional(),
  plannedWork: z.string().nullable().optional(),
  performedWork: z.string().nullable().optional(),
  discount: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum([
    'APPOINTMENT', 'VEHICLE_ARRIVED', 'INSPECTION', 'PREPARING_QUOTE',
    'AWAITING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'AWAITING_INSPECTION',
    'READY', 'DELIVERED', 'CANCELLED',
  ]),
  note: z.string().optional(),
});

export const addPartSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().min(1, 'Parça adı zorunludur.'),
  quantity: z.number().positive('Miktar pozitif olmalıdır.'),
  unitPrice: z.number().min(0, 'Birim fiyat negatif olamaz.'),
  notes: z.string().optional(),
});

export const addLaborSchema = z.object({
  description: z.string().min(1, 'İşçilik açıklaması zorunludur.'),
  hours: z.number().positive('Saat pozitif olmalıdır.'),
  hourlyRate: z.number().min(0, 'Saatlik ücret negatif olamaz.'),
});

export const addNoteSchema = z.object({
  content: z.string().min(1, 'Not içeriği zorunludur.'),
});

export const serviceOrderSearchSchema = z.object({
  q: z.string().min(1).optional(),
  status: z.string().optional(),
  customerId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateServiceOrderDto = z.infer<typeof createServiceOrderSchema>;
export type UpdateServiceOrderDto = z.infer<typeof updateServiceOrderSchema>;
export type ChangeStatusDto = z.infer<typeof changeStatusSchema>;
export type AddPartDto = z.infer<typeof addPartSchema>;
export type AddLaborDto = z.infer<typeof addLaborSchema>;
export type AddNoteDto = z.infer<typeof addNoteSchema>;
export type ServiceOrderSearchDto = z.infer<typeof serviceOrderSearchSchema>;
