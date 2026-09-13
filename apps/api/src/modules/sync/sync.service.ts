import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@otoservis/database';
import { randomUUID } from 'crypto';
import {
  createCustomerSchema,
  createVehicleSchema,
  createAppointmentSchema,
  createProductSchema,
} from '@otoservis/validation';

export interface SyncOperationDto {
  entityId: string;
  entityType: string;
  operationType: 'CREATE' | 'UPDATE' | 'DELETE';
  payload?: unknown;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  constructor(private prisma: PrismaService) {}

  async registerDevice(tenantId: string, data: { name: string; deviceKey?: string }) {
    const deviceKey = data.deviceKey || randomUUID();
    const existing = await this.prisma.device.findFirst({ where: { deviceKey } });
    if (existing) return existing;

    return this.prisma.device.create({
      data: { tenantId, name: data.name, deviceKey, isActive: true },
    });
  }

  async getDevice(deviceKey: string) {
    const device = await this.prisma.device.findFirst({ where: { deviceKey } });
    if (!device) throw new NotFoundException('Cihaz bulunamadı.');
    return device;
  }

  /**
   * Push: applies incoming offline operations to the real business tables
   * (upsert/delete per entity) and records them in sync_operations for audit.
   */
  async pushOperations(deviceKey: string, operations: SyncOperationDto[]) {
    const device = await this.getDevice(deviceKey);
    const results: Array<{ entityId: string; status: string; error?: string }> = [];

    for (const op of operations) {
      try {
        await this.applyOperation(device.tenantId, op);
        await this.prisma.syncOperation.create({
          data: {
            tenantId: device.tenantId,
            deviceId: device.id,
            operationId: randomUUID(),
            entityId: op.entityId,
            entityType: op.entityType,
            operationType: op.operationType,
            payload: (op.payload ?? {}) as Prisma.InputJsonValue,
            status: 'SYNCED',
          },
        });
        results.push({ entityId: op.entityId, status: 'SYNCED' });
      } catch (err: any) {
        this.logger.warn(`Sync op failed (${op.entityType}/${op.operationType}): ${err.message}`);
        results.push({ entityId: op.entityId, status: 'FAILED', error: err.message });
      }
    }

    await this.prisma.device.update({
      where: { deviceKey },
      data: { lastSyncAt: new Date() },
    });

    return results;
  }

  /**
   * Pull: returns every entity changed since `since` (updatedAt based delta),
   * so offline clients can upsert them into their local SQLite store.
   */
  async pullChanges(tenantId: string, since?: string) {
    const sinceDate = since ? new Date(since) : new Date(0);

    const [customers, vehicleRows, appointments, products, serviceOrders] = await Promise.all([
      this.prisma.customer.findMany({ where: { tenantId, updatedAt: { gt: sinceDate } } }),
      this.prisma.vehicle.findMany({
        where: { tenantId, updatedAt: { gt: sinceDate } },
        include: {
          vehicleOwners: {
            where: { endDate: null },
            select: { customerId: true },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.appointment.findMany({ where: { tenantId, updatedAt: { gt: sinceDate } } }),
      this.prisma.product.findMany({ where: { tenantId, updatedAt: { gt: sinceDate } } }),
      this.prisma.serviceOrder.findMany({
        where: { tenantId, updatedAt: { gt: sinceDate } },
        include: {
          customer: { select: { firstName: true, lastName: true } },
          vehicle: { select: { plate: true, brand: true, model: true } },
        },
      }),
    ]);

    // Flatten the current owner onto the vehicle so offline clients can store customerId
    const vehicles = vehicleRows.map((v) => {
      const { vehicleOwners, ...rest } = v;
      return { ...rest, customerId: vehicleOwners[0]?.customerId ?? null };
    });

    return {
      serverTime: new Date().toISOString(),
      entities: { customers, vehicles, appointments, products, serviceOrders },
    };
  }

  // ---------------------------------------------------------------------------
  // Operation application
  // ---------------------------------------------------------------------------

  private async applyOperation(tenantId: string, op: SyncOperationDto) {
    const { entityId, entityType, operationType, payload } = op;

    if (operationType === 'DELETE') {
      await this.deleteEntity(tenantId, entityType, entityId);
      return;
    }

    const p = (payload ?? {}) as Record<string, unknown>;

    switch (entityType) {
      case 'CUSTOMER': {
        const data = createCustomerSchema.omit({ addresses: true, contacts: true }).parse(p);
        await this.prisma.customer.upsert({
          where: { id: entityId },
          create: { id: entityId, tenantId, ...data },
          update: { ...data },
        });
        break;
      }

      case 'VEHICLE': {
        const { customerId, ...data } = createVehicleSchema.parse(p);
        const plateNormalized = String(data.plate).toUpperCase().replace(/[^0-9A-Z]/g, '');
        await this.prisma.vehicle.upsert({
          where: { id: entityId },
          create: { id: entityId, tenantId, ...data, plateNormalized },
          update: { ...data, plateNormalized },
        });
        if (customerId) {
          await this.assignVehicleOwner(tenantId, entityId, customerId);
        }
        break;
      }

      case 'APPOINTMENT': {
        const data = createAppointmentSchema.parse(p);
        await this.prisma.appointment.upsert({
          where: { id: entityId },
          create: { id: entityId, tenantId, ...data, date: new Date(data.date) },
          update: { ...data, date: new Date(data.date) },
        });
        break;
      }

      case 'PRODUCT': {
        const data = createProductSchema.parse(p);
        await this.prisma.product.upsert({
          where: { id: entityId },
          create: { id: entityId, tenantId, ...data },
          update: { ...data },
        });
        break;
      }

      case 'SERVICE_ORDER': {
        await this.applyServiceOrder(tenantId, entityId, operationType, p);
        break;
      }

      default:
        throw new Error(`Bilinmeyen entity tipi: ${entityType}`);
    }
  }

  /**
   * Links a vehicle to its owner customer (ends the previous active ownership).
   * Idempotent: re-assigning the same customer is a no-op.
   */
  private async assignVehicleOwner(tenantId: string, vehicleId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId } });
    if (!customer) throw new Error('Müşteri bulunamadı (henüz senkronize olmamış olabilir).');

    const current = await this.prisma.vehicleOwner.findFirst({
      where: { vehicleId, endDate: null },
      orderBy: { startDate: 'desc' },
    });
    if (current && current.customerId === customerId) return;

    if (current) {
      await this.prisma.vehicleOwner.update({
        where: { id: current.id },
        data: { endDate: new Date() },
      });
    }
    await this.prisma.vehicleOwner.create({ data: { vehicleId, customerId } });
  }

  private async applyServiceOrder(
    tenantId: string,
    entityId: string,
    operationType: string,
    p: Record<string, unknown>,
  ) {
    if (operationType === 'CREATE') {
      const required = ['orderNumber', 'customerId', 'vehicleId', 'createdById'];
      for (const f of required) {
        if (!p[f]) throw new Error(`SERVICE_ORDER CREATE: '${f}' zorunludur.`);
      }
    }

    const fields: Record<string, unknown> = {};
    const allowed = [
      'orderNumber', 'customerId', 'vehicleId', 'createdById', 'assignedToId',
      'km', 'customerComplaint', 'diagnosis', 'plannedWork', 'performedWork',
      'status', 'notes', 'discount', 'taxRate', 'taxAmount', 'totalAmount',
    ];
    for (const key of allowed) {
      if (p[key] !== undefined) fields[key] = p[key];
    }

    await this.prisma.serviceOrder.upsert({
      where: { id: entityId },
      create: { id: entityId, tenantId, ...fields } as Prisma.ServiceOrderUncheckedCreateInput,
      update: fields as Prisma.ServiceOrderUncheckedUpdateInput,
    });
  }

  private async deleteEntity(tenantId: string, entityType: string, entityId: string) {
    try {
      switch (entityType) {
        case 'CUSTOMER':
          await this.prisma.customer.deleteMany({ where: { id: entityId, tenantId } });
          break;
        case 'VEHICLE':
          await this.prisma.vehicle.deleteMany({ where: { id: entityId, tenantId } });
          break;
        case 'APPOINTMENT':
          await this.prisma.appointment.deleteMany({ where: { id: entityId, tenantId } });
          break;
        case 'PRODUCT':
          await this.prisma.product.deleteMany({ where: { id: entityId, tenantId } });
          break;
        case 'SERVICE_ORDER':
          await this.prisma.serviceOrder.deleteMany({ where: { id: entityId, tenantId } });
          break;
        default:
          throw new Error(`Bilinmeyen entity tipi: ${entityType}`);
      }
    } catch (err: any) {
      // Row may already be gone on the server — treat as success for idempotency
      this.logger.warn(`Delete ignored for ${entityType}/${entityId}: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Conflicts
  // ---------------------------------------------------------------------------

  async getConflicts(tenantId: string) {
    return this.prisma.syncConflict.findMany({
      where: { tenantId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveConflict(conflictId: string, tenantId: string, resolvedValue: unknown, userId?: string) {
    const conflict = await this.prisma.syncConflict.findFirst({
      where: { id: conflictId, tenantId },
    });
    if (!conflict) throw new NotFoundException('Çakışma bulunamadı.');

    return this.prisma.syncConflict.update({
      where: { id: conflictId },
      data: {
        resolvedValue: resolvedValue as Prisma.InputJsonValue,
        status: 'RESOLVED',
        resolvedById: userId,
        resolvedAt: new Date(),
      },
    });
  }
}
