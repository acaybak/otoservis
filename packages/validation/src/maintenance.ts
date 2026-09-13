import { z } from 'zod';

// ---------------------------------------------------------------------------
// MaintenanceType (bakım tipi) CRUD
// ---------------------------------------------------------------------------

export const createMaintenanceTypeSchema = z.object({
  name: z.string().min(1, 'Bakım tipi adı zorunludur.'),
  description: z.string().optional(),
  intervalKm: z.number().int().positive().optional(),
  intervalDays: z.number().int().positive().optional(),
});

export const updateMaintenanceTypeSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  intervalKm: z.number().int().positive().nullable().optional(),
  intervalDays: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// VehicleMaintenance (araç bakım planı) CRUD
// ---------------------------------------------------------------------------

export const createVehicleMaintenanceSchema = z.object({
  vehicleId: z.string().uuid('Geçerli bir araç ID giriniz.'),
  maintenanceTypeId: z.string().uuid('Geçerli bir bakım tipi ID giriniz.'),
  intervalKm: z.number().int().positive().optional(),
  intervalDays: z.number().int().positive().optional(),
  lastKm: z.number().int().min(0).optional(),
  lastDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const updateVehicleMaintenanceSchema = z.object({
  intervalKm: z.number().int().positive().nullable().optional(),
  intervalDays: z.number().int().positive().nullable().optional(),
  lastKm: z.number().int().min(0).nullable().optional(),
  lastDate: z.coerce.date().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// MaintenanceRecord (bakım kaydı) CRUD
// ---------------------------------------------------------------------------

export const createMaintenanceRecordSchema = z.object({
  vehicleId: z.string().uuid('Geçerli bir araç ID giriniz.'),
  maintenanceTypeId: z.string().uuid().optional(),
  serviceOrderId: z.string().uuid().optional(),
  performedAt: z.coerce.date(),
  km: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        itemType: z.enum(['OPERATION', 'PART']),
        productId: z.string().uuid().optional(),
        name: z.string().min(1, 'İşlem adı zorunludur.'),
        quantity: z.number().positive().default(1),
        unitPrice: z.number().min(0).default(0),
      }),
    )
    .optional(),
});

export const updateMaintenanceRecordSchema = z.object({
  maintenanceTypeId: z.string().uuid().nullable().optional(),
  performedAt: z.coerce.date().optional(),
  km: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ---------------------------------------------------------------------------
// MaintenanceItem (bakım kalemi) ekleme
// ---------------------------------------------------------------------------

export const addMaintenanceItemSchema = z.object({
  itemType: z.enum(['OPERATION', 'PART']),
  productId: z.string().uuid().optional(),
  name: z.string().min(1, 'İşlem adı zorunludur.'),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0).default(0),
});

// ---------------------------------------------------------------------------
// Search / query
// ---------------------------------------------------------------------------

export const maintenanceRecordSearchSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  maintenanceTypeId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const vehicleMaintenanceSearchSchema = z.object({
  vehicleId: z.string().uuid().optional(),
  maintenanceTypeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateMaintenanceTypeDto = z.infer<typeof createMaintenanceTypeSchema>;
export type UpdateMaintenanceTypeDto = z.infer<typeof updateMaintenanceTypeSchema>;
export type CreateVehicleMaintenanceDto = z.infer<typeof createVehicleMaintenanceSchema>;
export type UpdateVehicleMaintenanceDto = z.infer<typeof updateVehicleMaintenanceSchema>;
export type CreateMaintenanceRecordDto = z.infer<typeof createMaintenanceRecordSchema>;
export type UpdateMaintenanceRecordDto = z.infer<typeof updateMaintenanceRecordSchema>;
export type AddMaintenanceItemDto = z.infer<typeof addMaintenanceItemSchema>;
export type MaintenanceRecordSearchDto = z.infer<typeof maintenanceRecordSearchSchema>;
export type VehicleMaintenanceSearchDto = z.infer<typeof vehicleMaintenanceSearchSchema>;
