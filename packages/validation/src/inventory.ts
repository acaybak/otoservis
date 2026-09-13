import { z } from 'zod';

export const createProductCategorySchema = z.object({
  name: z.string().min(1, 'Kategori adı zorunludur.').max(200),
  parentId: z.string().uuid().nullable().optional(),
});

export const createProductSchema = z.object({
  code: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  name: z.string().min(1, 'Ürün adı zorunludur.').max(200),
  categoryId: z.string().uuid().optional(),
  brand: z.string().max(100).optional(),
  purchasePrice: z.number().min(0).default(0),
  salePrice: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(20),
  stock: z.number().min(0).default(0),
  minStock: z.number().min(0).default(0),
  supplierId: z.string().uuid().optional(),
});

export const updateProductSchema = z.object({
  code: z.string().max(50).nullable().optional(),
  barcode: z.string().max(50).nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  brand: z.string().max(100).nullable().optional(),
  purchasePrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  minStock: z.number().min(0).optional(),
  supplierId: z.string().uuid().nullable().optional(),
});

export const productSearchSchema = z.object({
  q: z.string().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  brand: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const stockAdjustmentSchema = z.object({
  quantity: z.number().min(0, 'Miktar negatif olamaz.'),
  note: z.string().optional(),
});

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Tedarikçi adı zorunludur.').max(200),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  taxNo: z.string().max(20).optional(),
  notes: z.string().optional(),
});

export const updateSupplierSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  taxNo: z.string().max(20).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type CreateProductCategoryDto = z.infer<typeof createProductCategorySchema>;
export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type ProductSearchDto = z.infer<typeof productSearchSchema>;
export type StockAdjustmentDto = z.infer<typeof stockAdjustmentSchema>;
export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierDto = z.infer<typeof updateSupplierSchema>;
