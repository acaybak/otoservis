import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır.'),
});

export const registerSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z
    .string()
    .min(8, 'Şifre en az 8 karakter olmalıdır.')
    .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir.')
    .regex(/[a-z]/, 'Şifre en az bir küçük harf içermelidir.')
    .regex(/[0-9]/, 'Şifre en az bir rakam içermelidir.'),
  firstName: z.string().min(1, 'Ad alanı zorunludur.').max(100),
  lastName: z.string().min(1, 'Soyad alanı zorunludur.').max(100),
  phone: z.string().max(20).optional(),
  tenantId: z.string().uuid().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token zorunludur.'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
