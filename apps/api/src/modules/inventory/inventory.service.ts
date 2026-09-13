import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  // === CATEGORIES ===
  async findCategories(tenantId: string) {
    return this.prisma.productCategory.findMany({
      where: { tenantId },
      include: { children: true, _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createCategory(tenantId: string, data: { name: string; parentId?: string | null }) {
    return this.prisma.productCategory.create({
      data: { tenantId, name: data.name, parentId: data.parentId || null },
    });
  }

  // === PRODUCTS ===
  async findProducts(
    tenantId: string,
    pagination: { skip: number; take: number },
    filters?: { q?: string; categoryId?: string; brand?: string; lowStock?: boolean },
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.brand) where.brand = { contains: filters.brand, mode: 'insensitive' };
    if (filters?.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { code: { contains: filters.q, mode: 'insensitive' } },
        { barcode: { contains: filters.q } },
      ];
    }
    if (filters?.lowStock) {
      where.stock = { lte: this.prisma.product.fields.minStock };
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true, supplier: { select: { id: true, name: true } } },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data, total };
  }

  async findProduct(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: true, supplier: true, inventoryTransactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!product) throw new NotFoundException('Ürün bulunamadı.');
    return product;
  }

  async createProduct(tenantId: string, data: Record<string, unknown>, userId: string) {
    if (data.code) {
      const existing = await this.prisma.product.findFirst({
        where: { tenantId, code: data.code as string },
      });
      if (existing) throw new ConflictException('Bu ürün kodu zaten kullanılıyor.');
    }

    const product = await this.prisma.product.create({
      data: { ...data, tenantId } as any,
      include: { category: true, supplier: true },
    });

    await this.auditService.log({
      tenantId, userId,
      action: 'PRODUCT_CREATED', entity: 'Product', entityId: product.id, newValue: product,
    });
    return product;
  }

  async updateProduct(tenantId: string, id: string, data: Record<string, unknown>, userId: string) {
    const existing = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Ürün bulunamadı.');

    const updated = await this.prisma.product.update({
      where: { id }, data,
      include: { category: true, supplier: true },
    });

    await this.auditService.log({
      tenantId, userId,
      action: 'PRODUCT_UPDATED', entity: 'Product', entityId: id,
      oldValue: existing, newValue: updated,
    });
    return updated;
  }

  async adjustStock(tenantId: string, id: string, quantity: number, note?: string, userId?: string) {
    const product = await this.prisma.product.findFirst({ where: { id, tenantId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı.');

    const oldStock = Number(product.stock);
    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data: { stock: quantity } });
      await tx.inventoryTransaction.create({
        data: {
          productId: id, type: 'STOCK_COUNT', quantity: quantity - oldStock,
          note: note || `Stok sayımı: ${oldStock} -> ${quantity}`, createdById: userId,
        },
      });
    });

    return this.prisma.product.findUnique({ where: { id } });
  }

  // === SUPPLIERS ===
  async findSuppliers(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createSupplier(tenantId: string, data: Record<string, unknown>) {
    return this.prisma.supplier.create({ data: { ...data, tenantId } as any });
  }

  async updateSupplier(tenantId: string, id: string, data: Record<string, unknown>) {
    const existing = await this.prisma.supplier.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Tedarikçi bulunamadı.');
    return this.prisma.supplier.update({ where: { id }, data });
  }
}
