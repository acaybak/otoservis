import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { VehicleMaintenanceService } from '../vehicle-maintenance/vehicle-maintenance.service';

@Injectable()
export class ServiceOrdersService {
  private readonly logger = new Logger(ServiceOrdersService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    @Inject(forwardRef(() => VehicleMaintenanceService))
    private vehicleMaintenanceService: VehicleMaintenanceService,
  ) {}

  private generateOrderNumber(): string {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const rand = Math.floor(Math.random() * 9000 + 1000);
    return `SO${year}${month}${day}${rand}`;
  }

  async findAll(
    tenantId: string,
    pagination: { skip: number; take: number },
    filters?: {
      q?: string; status?: string; customerId?: string;
      vehicleId?: string; assignedToId?: string; dateFrom?: string; dateTo?: string;
    },
  ) {
    const where: Record<string, unknown> = { tenantId };

    if (filters?.status) where.status = filters.status;
    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(filters.dateFrom);
      if (filters.dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(filters.dateTo);
    }
    if (filters?.q) {
      where.OR = [
        { orderNumber: { contains: filters.q, mode: 'insensitive' } },
        { customerComplaint: { contains: filters.q, mode: 'insensitive' } },
        { diagnosis: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          vehicle: { select: { id: true, plate: true, brand: true, model: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { parts: true, labor: true } },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.serviceOrder.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        vehicle: { include: { vehicleOwners: { include: { customer: true }, where: { endDate: null } } } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        parts: true,
        labor: true,
        notes_: { orderBy: { createdAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        attachments: true,
        accountTransactions: true,
      },
    });

    if (!order) throw new NotFoundException('İş emri bulunamadı.');
    return order;
  }

  async create(
    tenantId: string,
    data: {
      customerId: string; vehicleId: string; km?: number;
      customerComplaint?: string; diagnosis?: string; plannedWork?: string;
      assignedToId?: string; notes?: string;
    },
    userId: string,
  ) {
    // Verify customer & vehicle belong to tenant
    const customer = await this.prisma.customer.findFirst({ where: { id: data.customerId, tenantId } });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı.');

    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: data.vehicleId, tenantId } });
    if (!vehicle) throw new NotFoundException('Araç bulunamadı.');

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.serviceOrder.create({
        data: {
          tenantId,
          orderNumber: this.generateOrderNumber(),
          customerId: data.customerId,
          vehicleId: data.vehicleId,
          km: data.km || null,
          customerComplaint: data.customerComplaint || null,
          diagnosis: data.diagnosis || null,
          plannedWork: data.plannedWork || null,
          assignedToId: data.assignedToId || null,
          createdById: userId,
          notes: data.notes || null,
          status: 'APPOINTMENT',
        },
      });

      await tx.serviceOrderStatusHistory.create({
        data: {
          serviceOrderId: created.id,
          toStatus: 'APPOINTMENT',
          changedById: userId,
          note: 'İş emri oluşturuldu.',
        },
      });

      return tx.serviceOrder.findUnique({
        where: { id: created.id },
        include: { customer: true, vehicle: true, parts: true, labor: true },
      });
    });

    await this.auditService.log({
      tenantId, userId,
      action: 'SERVICE_ORDER_CREATED',
      entity: 'ServiceOrder',
      entityId: order!.id,
      newValue: order,
    });

    return order;
  }

  async update(tenantId: string, id: string, data: Record<string, unknown>, userId: string) {
    const existing = await this.prisma.serviceOrder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('İş emri bulunamadı.');

    const updated = await this.prisma.serviceOrder.update({
      where: { id },
      data,
      include: { customer: true, vehicle: true, parts: true, labor: true },
    });

    await this.auditService.log({
      tenantId, userId,
      action: 'SERVICE_ORDER_UPDATED',
      entity: 'ServiceOrder',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  async changeStatus(tenantId: string, id: string, status: string, userId: string, note?: string) {
    const existing = await this.prisma.serviceOrder.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('İş emri bulunamadı.');

    const oldStatus = existing.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.serviceOrder.update({
        where: { id },
        data: { status },
      });

      await tx.serviceOrderStatusHistory.create({
        data: {
          serviceOrderId: id,
          fromStatus: oldStatus,
          toStatus: status,
          changedById: userId,
          note: note || null,
        },
      });

      return order;
    });

    await this.auditService.log({
      tenantId, userId,
      action: 'SERVICE_ORDER_STATUS_CHANGED',
      entity: 'ServiceOrder',
      entityId: id,
      oldValue: { status: oldStatus },
      newValue: { status },
    });

    // Auto-create maintenance record when order is delivered
    if (status === 'DELIVERED') {
      try {
        await this.vehicleMaintenanceService.createRecordFromServiceOrder(
          tenantId,
          id,
          userId,
        );
      } catch (err) {
        this.logger.error(
          `Failed to auto-create maintenance record for order ${id}: ${(err as Error).message}`,
        );
      }
    }

    return updated;
  }

  async addPart(tenantId: string, id: string, data: {
    productId?: string; name: string; quantity: number; unitPrice: number; notes?: string;
  }, userId: string) {
    const order = await this.prisma.serviceOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('İş emri bulunamadı.');

    const total = data.quantity * data.unitPrice;

    const part = await this.prisma.serviceOrderPart.create({
      data: {
        serviceOrderId: id,
        productId: data.productId || null,
        name: data.name,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        total,
        notes: data.notes || null,
      },
    });

    // If linked to a product, deduct stock
    if (data.productId) {
      await this.prisma.inventoryTransaction.create({
        data: {
          productId: data.productId,
          type: 'SERVICE_USAGE',
          quantity: -data.quantity,
          unitPrice: data.unitPrice,
          referenceId: id,
          createdById: userId,
        },
      });
      await this.prisma.product.update({
        where: { id: data.productId },
        data: { stock: { decrement: data.quantity } },
      });
    }

    await this.recalculateTotal(id);
    return part;
  }

  async addLabor(tenantId: string, id: string, data: {
    description: string; hours: number; hourlyRate: number;
  }) {
    const order = await this.prisma.serviceOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('İş emri bulunamadı.');

    const total = data.hours * data.hourlyRate;

    const labor = await this.prisma.serviceOrderLabor.create({
      data: {
        serviceOrderId: id,
        description: data.description,
        hours: data.hours,
        hourlyRate: data.hourlyRate,
        total,
      },
    });

    await this.recalculateTotal(id);
    return labor;
  }

  async addNote(tenantId: string, id: string, content: string, userId: string) {
    const order = await this.prisma.serviceOrder.findFirst({ where: { id, tenantId } });
    if (!order) throw new NotFoundException('İş emri bulunamadı.');

    return this.prisma.serviceOrderNote.create({
      data: { serviceOrderId: id, content, createdById: userId },
    });
  }

  async removePart(partId: string, tenantId: string) {
    const part = await this.prisma.serviceOrderPart.findUnique({
      where: { id: partId },
      include: { serviceOrder: true },
    });
    if (!part || part.serviceOrder.tenantId !== tenantId) {
      throw new NotFoundException('Parça bulunamadı.');
    }

    await this.prisma.serviceOrderPart.delete({ where: { id: partId } });
    await this.recalculateTotal(part.serviceOrderId);
    return { message: 'Parça silindi.' };
  }

  async removeLabor(laborId: string, tenantId: string) {
    const labor = await this.prisma.serviceOrderLabor.findUnique({
      where: { id: laborId },
      include: { serviceOrder: true },
    });
    if (!labor || labor.serviceOrder.tenantId !== tenantId) {
      throw new NotFoundException('İşçilik bulunamadı.');
    }

    await this.prisma.serviceOrderLabor.delete({ where: { id: laborId } });
    await this.recalculateTotal(labor.serviceOrderId);
    return { message: 'İşçilik silindi.' };
  }

  private async recalculateTotal(serviceOrderId: string) {
    const [parts, labor, order] = await Promise.all([
      this.prisma.serviceOrderPart.findMany({ where: { serviceOrderId } }),
      this.prisma.serviceOrderLabor.findMany({ where: { serviceOrderId } }),
      this.prisma.serviceOrder.findUnique({ where: { id: serviceOrderId } }),
    ]);

    if (!order) return;

    const partsTotal = parts.reduce((sum, p) => sum + Number(p.total), 0);
    const laborTotal = labor.reduce((sum, l) => sum + Number(l.total), 0);
    const subtotal = partsTotal + laborTotal;
    const discount = Number(order.discount || 0);
    const taxRate = Number(order.taxRate || 20) / 100;
    const taxableAmount = subtotal - discount;
    const taxAmount = taxableAmount * taxRate;
    const totalAmount = taxableAmount + taxAmount;

    await this.prisma.serviceOrder.update({
      where: { id: serviceOrderId },
      data: {
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
      },
    });
  }
}
