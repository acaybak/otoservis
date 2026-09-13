import { z } from 'zod';

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).nullable().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export const assignRoleSchema = z.object({
  roleId: z.string().uuid('Geçerli bir rol ID giriniz.'),
});

export const createUserSchema = z.object({
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
  roleIds: z.array(z.string().uuid()).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type AssignRoleDto = z.infer<typeof assignRoleSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;
