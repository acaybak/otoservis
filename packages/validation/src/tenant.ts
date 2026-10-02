import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Servis adı zorunludur.').max(200),
  slug: z
    .string()
    .min(1, 'Slug zorunludur.')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir.'),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir.')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL']).optional(),
  settings: z.record(z.unknown()).optional(),
});

// Tenant self-service profile update (firma bilgileri + web sitesi)
export const updateTenantProfileSchema = z.object({
  name: z.string().min(1, 'Servis adı zorunludur.').max(200).optional(),
  phone: z.string().max(20).optional().nullable(),
  email: z
    .union([z.string().email('Geçerli bir e-posta adresi giriniz.'), z.literal('')])
    .optional()
    .nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  website: z
    .union([z.string().max(500), z.literal(''), z.null()])
    .optional()
    .transform((v) => {
      if (v == null) return v;
      const trimmed = v.trim();
      if (!trimmed) return null;
      return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    })
    .refine(
      (v) => v == null || /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(v),
      'Geçerli bir web adresi giriniz (örn: www.site.com).',
    ),
});

export const tenantSetupSchema = z.object({
  tenantName: z.string().min(1, 'Servis adı zorunludur.').max(200),
  tenantSlug: z
    .string()
    .min(1, 'Slug zorunludur.')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir.'),
  adminEmail: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  adminPassword: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır.')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir.')
    .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir.')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir.'),
  adminFirstName: z.string().min(1, 'Ad zorunludur.').max(100),
  adminLastName: z.string().min(1, 'Soyad zorunludur.').max(100),
  adminPhone: z.string().max(20).optional(),
  // Tenant contact info
  phone: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
});

export type CreateTenantDto = z.infer<typeof createTenantSchema>;
export type UpdateTenantDto = z.infer<typeof updateTenantSchema>;
export type UpdateTenantProfileDto = z.infer<typeof updateTenantProfileSchema>;
export type TenantSetupDto = z.infer<typeof tenantSetupSchema>;
