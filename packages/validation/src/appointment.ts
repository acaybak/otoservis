import { z } from 'zod';

export const createAppointmentSchema = z.object({
  customerId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  plate: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  service: z.string().optional(),
  date: z.string().min(1, 'Tarih zorunludur.'),
  time: z.string().min(1, 'Saat zorunludur.'),
  duration: z.number().int().min(15).max(480).default(60),
  technicianId: z.string().uuid().optional(),
  notes: z.string().optional(),
  source: z.enum(['DESKTOP', 'ONLINE']).default('DESKTOP'),
});

export const updateAppointmentSchema = z.object({
  customerId: z.string().uuid().nullable().optional(),
  vehicleId: z.string().uuid().nullable().optional(),
  plate: z.string().max(20).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  service: z.string().nullable().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  duration: z.number().int().min(15).max(480).optional(),
  technicianId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const changeAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  note: z.string().optional(),
});

export const appointmentSearchSchema = z.object({
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  technicianId: z.string().uuid().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;
export type ChangeAppointmentStatusDto = z.infer<typeof changeAppointmentStatusSchema>;
export type AppointmentSearchDto = z.infer<typeof appointmentSearchSchema>;
