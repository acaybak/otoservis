import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  data: z.record(z.unknown()).optional(),
});

export const updateSettingsSchema = z.object({
  settings: z.record(z.unknown()),
});

export const dashboardQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const reportQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('month'),
});

export type CreateNotificationDto = z.infer<typeof createNotificationSchema>;
export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;
export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>;
export type ReportQueryDto = z.infer<typeof reportQuerySchema>;
