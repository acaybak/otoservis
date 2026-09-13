import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class VehicleMaintenanceService {
  private readonly logger = new Logger(VehicleMaintenanceService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  // ===========================================================================
  // MAINTENANCE TYPE (Bakım Tipi) CRUD
  // ===========================================================================

  async findAllTypes(tenantId: string) {
    return this.prisma.maintenanceType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOneType(tenantId: string, id: string) {
    const type = await this.prisma.maintenanceType.findFirst({
      where: { id, tenantId },
    });
    if (!type) throw new NotFoundException('Bakım tipi bulunamadı.');
    return type;
  }

  async createType(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      intervalKm?: number;
      intervalDays?: number;
    },
    userId: string,
  ) {
    const type = await this.prisma.maintenanceType.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description || null,
        intervalKm: data.intervalKm || null,
        intervalDays: data.intervalDays || null,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'MAINTENANCE_TYPE_CREATED',
      entity: 'MaintenanceType',
      entityId: type.id,
      newValue: type,
    });

    return type;
  }

  async updateType(
    tenantId: string,
    id: string,
    data: Record<string, unknown>,
    userId: string,
  ) {
    const existing = await this.prisma.maintenanceType.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Bakım tipi bulunamadı.');

    const updated = await this.prisma.maintenanceType.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'MAINTENANCE_TYPE_UPDATED',
      entity: 'MaintenanceType',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  async deleteType(tenantId: string, id: string, userId: string) {
    const existing = await this.prisma.maintenanceType.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Bakım tipi bulunamadı.');

    await this.prisma.maintenanceType.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'MAINTENANCE_TYPE_DELETED',
      entity: 'MaintenanceType',
      entityId: id,
      oldValue: existing,
    });

    return { message: 'Bakım tipi silindi.' };
  }

  // ===========================================================================
  // VEHICLE MAINTENANCE (Araç Bakım Planı) CRUD
  // ===========================================================================

  async findAllVehicleMaintenances(
    tenantId: string,
    pagination: { skip: number; take: number },
    filters?: { vehicleId?: string; maintenanceTypeId?: string },
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters?.maintenanceTypeId) where.maintenanceTypeId = filters.maintenanceTypeId;

    const [data, total] = await Promise.all([
      this.prisma.vehicleMaintenance.findMany({
        where,
        include: {
          vehicle: { select: { id: true, plate: true, brand: true, model: true } },
          maintenanceType: { select: { id: true, name: true, intervalKm: true, intervalDays: true } },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.vehicleMaintenance.count({ where }),
    ]);

    return { data, total };
  }

  async findOneVehicleMaintenance(tenantId: string, id: string) {
    const vm = await this.prisma.vehicleMaintenance.findFirst({
      where: { id, tenantId },
      include: {
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        maintenanceType: true,
      },
    });
    if (!vm) throw new NotFoundException('Araç bakım planı bulunamadı.');
    return vm;
  }

  async createVehicleMaintenance(
    tenantId: string,
    data: {
      vehicleId: string;
      maintenanceTypeId: string;
      intervalKm?: number;
      intervalDays?: number;
      lastKm?: number;
      lastDate?: Date;
      notes?: string;
    },
    userId: string,
  ) {
    // Verify vehicle belongs to tenant
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: data.vehicleId, tenantId },
    });
    if (!vehicle) throw new NotFoundException('Araç bulunamadı.');

    // Verify maintenance type belongs to tenant
    const type = await this.prisma.maintenanceType.findFirst({
      where: { id: data.maintenanceTypeId, tenantId },
    });
    if (!type) throw new NotFoundException('Bakım tipi bulunamadı.');

    const vm = await this.prisma.vehicleMaintenance.create({
      data: {
        tenantId,
        vehicleId: data.vehicleId,
        maintenanceTypeId: data.maintenanceTypeId,
        intervalKm: data.intervalKm || null,
        intervalDays: data.intervalDays || null,
        lastKm: data.lastKm || null,
        lastDate: data.lastDate || null,
        notes: data.notes || null,
      },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'VEHICLE_MAINTENANCE_CREATED',
      entity: 'VehicleMaintenance',
      entityId: vm.id,
      newValue: vm,
    });

    return vm;
  }

  async updateVehicleMaintenance(
    tenantId: string,
    id: string,
    data: Record<string, unknown>,
    userId: string,
  ) {
    const existing = await this.prisma.vehicleMaintenance.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Araç bakım planı bulunamadı.');

    const updated = await this.prisma.vehicleMaintenance.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'VEHICLE_MAINTENANCE_UPDATED',
      entity: 'VehicleMaintenance',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  async deleteVehicleMaintenance(tenantId: string, id: string, userId: string) {
    const existing = await this.prisma.vehicleMaintenance.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Araç bakım planı bulunamadı.');

    await this.prisma.vehicleMaintenance.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'VEHICLE_MAINTENANCE_DELETED',
      entity: 'VehicleMaintenance',
      entityId: id,
      oldValue: existing,
    });

    return { message: 'Araç bakım planı silindi.' };
  }

  // ===========================================================================
  // MAINTENANCE RECORD (Bakım Kaydı) CRUD
  // ===========================================================================

  async findAllRecords(
    tenantId: string,
    pagination: { skip: number; take: number },
    filters?: {
      vehicleId?: string;
      maintenanceTypeId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (filters?.vehicleId) where.vehicleId = filters.vehicleId;
    if (filters?.maintenanceTypeId) where.maintenanceTypeId = filters.maintenanceTypeId;
    if (filters?.dateFrom || filters?.dateTo) {
      where.performedAt = {};
      if (filters.dateFrom) (where.performedAt as Record<string, unknown>).gte = new Date(filters.dateFrom);
      if (filters.dateTo) (where.performedAt as Record<string, unknown>).lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.maintenanceRecord.findMany({
        where,
        include: {
          vehicle: { select: { id: true, plate: true, brand: true, model: true } },
          maintenanceType: { select: { id: true, name: true } },
          serviceOrder: { select: { id: true, orderNumber: true } },
          items: true,
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { performedAt: 'desc' },
      }),
      this.prisma.maintenanceRecord.count({ where }),
    ]);

    return { data, total };
  }

  async findOneRecord(tenantId: string, id: string) {
    const record = await this.prisma.maintenanceRecord.findFirst({
      where: { id, tenantId },
      include: {
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        maintenanceType: true,
        serviceOrder: { select: { id: true, orderNumber: true, status: true } },
        items: { include: { product: { select: { id: true, name: true, code: true } } } },
      },
    });
    if (!record) throw new NotFoundException('Bakım kaydı bulunamadı.');
    return record;
  }

  async createRecord(
    tenantId: string,
    data: {
      vehicleId: string;
      maintenanceTypeId?: string;
      serviceOrderId?: string;
      performedAt: Date;
      km?: number;
      notes?: string;
      items?: Array<{
        itemType: 'OPERATION' | 'PART';
        productId?: string;
        name: string;
        quantity: number;
        unitPrice: number;
      }>;
    },
    userId: string,
  ) {
    // Verify vehicle
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: data.vehicleId, tenantId },
    });
    if (!vehicle) throw new NotFoundException('Araç bulunamadı.');

    // Calculate total from items
    const items = data.items || [];
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const record = await this.prisma.$transaction(async (tx) => {
      const created = await tx.maintenanceRecord.create({
        data: {
          tenantId,
          vehicleId: data.vehicleId,
          maintenanceTypeId: data.maintenanceTypeId || null,
          serviceOrderId: data.serviceOrderId || null,
          performedAt: data.performedAt,
          km: data.km || null,
          notes: data.notes || null,
          totalAmount,
        },
      });

      // Create items
      if (items.length > 0) {
        await tx.maintenanceItem.createMany({
          data: items.map((item) => ({
            tenantId,
            maintenanceRecordId: created.id,
            itemType: item.itemType,
            productId: item.productId || null,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        });
      }

      // Update vehicle km if provided
      if (data.km && data.km > (vehicle.km || 0)) {
        await tx.vehicle.update({
          where: { id: data.vehicleId },
          data: { km: data.km },
        });
      }

      // Update VehicleMaintenance lastKm/lastDate if linked
      if (data.maintenanceTypeId) {
        await tx.vehicleMaintenance.updateMany({
          where: {
            tenantId,
            vehicleId: data.vehicleId,
            maintenanceTypeId: data.maintenanceTypeId,
          },
          data: {
            lastKm: data.km || undefined,
            lastDate: data.performedAt,
          },
        });
      }

      return tx.maintenanceRecord.findUnique({
        where: { id: created.id },
        include: { items: true, vehicle: true, maintenanceType: true },
      });
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'MAINTENANCE_RECORD_CREATED',
      entity: 'MaintenanceRecord',
      entityId: record!.id,
      newValue: record,
    });

    return record;
  }

  async updateRecord(
    tenantId: string,
    id: string,
    data: Record<string, unknown>,
    userId: string,
  ) {
    const existing = await this.prisma.maintenanceRecord.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Bakım kaydı bulunamadı.');

    const updated = await this.prisma.maintenanceRecord.update({
      where: { id },
      data,
      include: { items: true },
    });

    // Recalculate total if items changed
    const totalAmount = updated.items.reduce(
      (sum, item) => sum + Number(item.total),
      0,
    );
    if (Math.abs(Number(updated.totalAmount) - totalAmount) > 0.01) {
      await this.prisma.maintenanceRecord.update({
        where: { id },
        data: { totalAmount },
      });
    }

    await this.auditService.log({
      tenantId,
      userId,
      action: 'MAINTENANCE_RECORD_UPDATED',
      entity: 'MaintenanceRecord',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  async deleteRecord(tenantId: string, id: string, userId: string) {
    const existing = await this.prisma.maintenanceRecord.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Bakım kaydı bulunamadı.');

    await this.prisma.maintenanceRecord.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'MAINTENANCE_RECORD_DELETED',
      entity: 'MaintenanceRecord',
      entityId: id,
      oldValue: existing,
    });

    return { message: 'Bakım kaydı silindi.' };
  }

  // ===========================================================================
  // MAINTENANCE ITEM (Bakım Kalemi) management
  // ===========================================================================

  async addItem(
    tenantId: string,
    recordId: string,
    data: {
      itemType: 'OPERATION' | 'PART';
      productId?: string;
      name: string;
      quantity: number;
      unitPrice: number;
    },
    userId: string,
  ) {
    const record = await this.prisma.maintenanceRecord.findFirst({
      where: { id: recordId, tenantId },
    });
    if (!record) throw new NotFoundException('Bakım kaydı bulunamadı.');

    const total = data.quantity * data.unitPrice;

    const item = await this.prisma.maintenanceItem.create({
      data: {
        tenantId,
        maintenanceRecordId: recordId,
        itemType: data.itemType,
        productId: data.productId || null,
        name: data.name,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        total,
      },
    });

    // Recalculate record total
    await this.recalculateRecordTotal(recordId);

    // If PART item linked to product, deduct stock
    if (data.itemType === 'PART' && data.productId) {
      await this.prisma.inventoryTransaction.create({
        data: {
          productId: data.productId,
          type: 'SERVICE_USAGE',
          quantity: -data.quantity,
          unitPrice: data.unitPrice,
          referenceId: recordId,
          createdById: userId,
        },
      });
      await this.prisma.product.update({
        where: { id: data.productId },
        data: { stock: { decrement: data.quantity } },
      });
    }

    await this.auditService.log({
      tenantId,
      userId,
      action: 'MAINTENANCE_ITEM_ADDED',
      entity: 'MaintenanceItem',
      entityId: item.id,
      newValue: item,
    });

    return item;
  }

  async removeItem(tenantId: string, itemId: string, userId: string) {
    const item = await this.prisma.maintenanceItem.findUnique({
      where: { id: itemId },
      include: { record: true },
    });
    if (!item || item.record.tenantId !== tenantId) {
      throw new NotFoundException('Bakım kalemi bulunamadı.');
    }

    await this.prisma.maintenanceItem.delete({ where: { id: itemId } });
    await this.recalculateRecordTotal(item.maintenanceRecordId);

    await this.auditService.log({
      tenantId,
      userId,
      action: 'MAINTENANCE_ITEM_REMOVED',
      entity: 'MaintenanceItem',
      entityId: itemId,
      oldValue: item,
    });

    return { message: 'Bakım kalemi silindi.' };
  }

  private async recalculateRecordTotal(recordId: string) {
    const items = await this.prisma.maintenanceItem.findMany({
      where: { maintenanceRecordId: recordId },
    });
    const totalAmount = items.reduce((sum, item) => sum + Number(item.total), 0);

    await this.prisma.maintenanceRecord.update({
      where: { id: recordId },
      data: { totalAmount },
    });
  }

  // ===========================================================================
  // VEHICLE MAINTENANCE HISTORY (Araç Bakım Geçmişi)
  // ===========================================================================

  async getVehicleHistory(tenantId: string, vehicleId: string) {
    // Verify vehicle
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId },
    });
    if (!vehicle) throw new NotFoundException('Araç bulunamadı.');

    const records = await this.prisma.maintenanceRecord.findMany({
      where: { tenantId, vehicleId },
      include: {
        maintenanceType: { select: { id: true, name: true } },
        serviceOrder: { select: { id: true, orderNumber: true, status: true } },
        items: true,
      },
      orderBy: { performedAt: 'desc' },
    });

    return {
      vehicle: {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        km: vehicle.km,
      },
      records,
      totalRecords: records.length,
      totalCost: records.reduce((sum, r) => sum + Number(r.totalAmount), 0),
    };
  }

  // ===========================================================================
  // AUTO-CREATE from Service Order (İş emrinden otomatik bakım kaydı)
  // ===========================================================================

  async createRecordFromServiceOrder(
    tenantId: string,
    serviceOrderId: string,
    userId: string,
  ) {
    // Fetch service order with all details
    const order = await this.prisma.serviceOrder.findFirst({
      where: { id: serviceOrderId, tenantId },
      include: {
        parts: true,
        labor: true,
      },
    });

    if (!order) throw new NotFoundException('İş emri bulunamadı.');

    // Check if a maintenance record already exists for this service order
    const existing = await this.prisma.maintenanceRecord.findFirst({
      where: { tenantId, serviceOrderId },
    });
    if (existing) {
      this.logger.log(
        `Maintenance record already exists for service order ${order.orderNumber}, skipping.`,
      );
      return existing;
    }

    // Build items from parts + labor
    const items: Array<{
      itemType: 'OPERATION' | 'PART';
      productId?: string;
      name: string;
      quantity: number;
      unitPrice: number;
    }> = [];

    // Add parts as PART items
    for (const part of order.parts) {
      items.push({
        itemType: 'PART',
        productId: part.productId || undefined,
        name: part.name,
        quantity: Number(part.quantity),
        unitPrice: Number(part.unitPrice),
      });
    }

    // Add labor as OPERATION items
    for (const lab of order.labor) {
      items.push({
        itemType: 'OPERATION',
        name: lab.description,
        quantity: Number(lab.hours),
        unitPrice: Number(lab.hourlyRate),
      });
    }

    // Create the maintenance record
    const record = await this.createRecord(
      tenantId,
      {
        vehicleId: order.vehicleId,
        performedAt: new Date(),
        km: order.km || undefined,
        serviceOrderId: order.id,
        notes: order.performedWork || order.diagnosis || undefined,
        items,
      },
      userId,
    );

    this.logger.log(
      `Auto-created maintenance record ${record!.id} from service order ${order.orderNumber}`,
    );

    return record;
  }
}
