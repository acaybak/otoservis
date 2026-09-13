import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { normalizePlate } from '@otoservis/shared';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(
    tenantId: string,
    pagination: { skip: number; take: number },
    search?: { q?: string; plate?: string; brand?: string },
  ) {
    const where: Record<string, unknown> = { tenantId };

    if (search?.plate) {
      where.plateNormalized = normalizePlate(search.plate);
    }
    if (search?.brand) {
      where.brand = { contains: search.brand, mode: 'insensitive' };
    }
    if (search?.q) {
      const normalized = normalizePlate(search.q);
      where.OR = [
        { plateNormalized: { contains: normalized } },
        { brand: { contains: search.q, mode: 'insensitive' } },
        { model: { contains: search.q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        include: {
          vehicleOwners: {
            include: { customer: true },
            where: { endDate: null },
          },
          _count: { select: { serviceOrders: true } },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(tenantId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: {
        vehicleOwners: {
          include: { customer: true },
          orderBy: { startDate: 'desc' },
        },
        serviceOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Araç bulunamadı.');
    }

    return vehicle;
  }

  async findByPlate(tenantId: string, plate: string) {
    const normalized = normalizePlate(plate);
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { tenantId, plateNormalized: normalized },
      include: {
        vehicleOwners: { include: { customer: true }, where: { endDate: null } },
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Araç bulunamadı.');
    }

    return vehicle;
  }

  async create(
    tenantId: string,
    data: {
      plate: string;
      brand?: string;
      model?: string;
      year?: number;
      vin?: string;
      engineNo?: string;
      km?: number;
      fuelType?: string;
      transmission?: string;
      color?: string;
      notes?: string;
      customerId?: string;
    },
    userId?: string,
  ) {
    const plateNormalized = normalizePlate(data.plate);

    const existing = await this.prisma.vehicle.findFirst({
      where: { tenantId, plateNormalized },
    });

    if (existing) {
      throw new ConflictException('Bu plakaya sahip bir araç zaten kayıtlı.');
    }

    const vehicle = await this.prisma.$transaction(async (tx) => {
      const created = await tx.vehicle.create({
        data: {
          tenantId,
          plate: data.plate.toUpperCase(),
          plateNormalized,
          brand: data.brand || null,
          model: data.model || null,
          year: data.year || null,
          vin: data.vin || null,
          engineNo: data.engineNo || null,
          km: data.km || null,
          fuelType: data.fuelType || null,
          transmission: data.transmission || null,
          color: data.color || null,
          notes: data.notes || null,
        },
      });

      if (data.customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: data.customerId, tenantId },
        });
        if (!customer) {
          throw new NotFoundException('Müşteri bulunamadı.');
        }
        await tx.vehicleOwner.create({
          data: { vehicleId: created.id, customerId: data.customerId },
        });
      }

      return tx.vehicle.findUnique({
        where: { id: created.id },
        include: { vehicleOwners: { include: { customer: true } } },
      });
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'VEHICLE_CREATED',
      entity: 'Vehicle',
      entityId: vehicle!.id,
      newValue: vehicle,
    });

    this.logger.log(`Vehicle created: ${vehicle!.id} plate: ${plateNormalized}`);
    return vehicle;
  }

  async update(
    tenantId: string,
    id: string,
    data: Record<string, unknown>,
    userId?: string,
  ) {
    const existing = await this.prisma.vehicle.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Araç bulunamadı.');
    }

    if (data.plate) {
      const plateNormalized = normalizePlate(data.plate as string);
      data.plate = (data.plate as string).toUpperCase();
      data.plateNormalized = plateNormalized;
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data,
      include: { vehicleOwners: { include: { customer: true } } },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'VEHICLE_UPDATED',
      entity: 'Vehicle',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  async addOwner(tenantId: string, vehicleId: string, customerId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, tenantId },
    });
    if (!vehicle) throw new NotFoundException('Araç bulunamadı.');

    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });
    if (!customer) throw new NotFoundException('Müşteri bulunamadı.');

    // End current ownership
    await this.prisma.vehicleOwner.updateMany({
      where: { vehicleId, endDate: null },
      data: { endDate: new Date() },
    });

    return this.prisma.vehicleOwner.create({
      data: { vehicleId, customerId },
    });
  }

  async remove(tenantId: string, id: string, userId?: string) {
    const existing = await this.prisma.vehicle.findFirst({
      where: { id, tenantId },
    });
    if (!existing) throw new NotFoundException('Araç bulunamadı.');

    const activeOrders = await this.prisma.serviceOrder.count({
      where: { vehicleId: id, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
    });
    if (activeOrders > 0) {
      throw new ConflictException('Bu aracın aktif iş emirleri var.');
    }

    await this.prisma.vehicle.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'VEHICLE_DELETED',
      entity: 'Vehicle',
      entityId: id,
      oldValue: existing,
    });

    return { message: 'Araç başarıyla silindi.' };
  }
}
