import { z } from 'zod';

export const createVehicleSchema = z.object({
  plate: z.string().min(1, 'Plaka zorunludur.').max(20),
  brand: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  vin: z.string().max(17).optional(),
  engineNo: z.string().max(50).optional(),
  km: z.number().int().min(0).optional(),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'LPG', 'ELECTRIC', 'HYBRID']).optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC']).optional(),
  color: z.string().max(50).optional(),
  notes: z.string().optional(),
  customerId: z.string().uuid().optional(),
});

export const updateVehicleSchema = z.object({
  plate: z.string().min(1).max(20).optional(),
  brand: z.string().max(100).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  vin: z.string().max(17).nullable().optional(),
  engineNo: z.string().max(50).nullable().optional(),
  km: z.number().int().min(0).nullable().optional(),
  fuelType: z.enum(['GASOLINE', 'DIESEL', 'LPG', 'ELECTRIC', 'HYBRID']).nullable().optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC']).nullable().optional(),
  color: z.string().max(50).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const vehicleSearchSchema = z.object({
  q: z.string().min(1).optional(),
  plate: z.string().optional(),
  brand: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateVehicleDto = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDto = z.infer<typeof updateVehicleSchema>;
export type VehicleSearchDto = z.infer<typeof vehicleSearchSchema>;
