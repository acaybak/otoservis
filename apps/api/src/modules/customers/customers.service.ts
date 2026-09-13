import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(
    tenantId: string,
    pagination: { skip: number; take: number },
    search?: { q?: string; phone?: string },
  ) {
    const where: Record<string, unknown> = { tenantId };

    if (search?.q) {
      where.OR = [
        { firstName: { contains: search.q, mode: 'insensitive' } },
        { lastName: { contains: search.q, mode: 'insensitive' } },
        { phone: { contains: search.q } },
        { email: { contains: search.q, mode: 'insensitive' } },
      ];
    }
    if (search?.phone) {
      where.phone = { contains: search.phone };
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          addresses: true,
          contacts: true,
          _count: { select: { vehicleOwners: true, serviceOrders: true } },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        addresses: true,
        contacts: true,
        vehicleOwners: { include: { vehicle: true } },
        customerAccount: true,
        _count: { select: { serviceOrders: true, appointments: true } },
      },
    });

    if (!customer) {
      throw new NotFoundException('Müşteri bulunamadı.');
    }

    return customer;
  }

  async create(
    tenantId: string,
    data: {
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
      tcNo?: string;
      notes?: string;
      addresses?: Array<{ type: string; address: string; city?: string; district?: string; postalCode?: string }>;
      contacts?: Array<{ type: string; value: string }>;
    },
    userId?: string,
  ) {
    const customer = await this.prisma.$transaction(async (tx) => {
      const created = await tx.customer.create({
        data: {
          tenantId,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          email: data.email || null,
          tcNo: data.tcNo || null,
          notes: data.notes || null,
        },
      });

      if (data.addresses?.length) {
        await tx.customerAddress.createMany({
          data: data.addresses.map((a) => ({
            customerId: created.id,
            type: a.type,
            address: a.address,
            city: a.city,
            district: a.district,
            postalCode: a.postalCode,
          })),
        });
      }

      if (data.contacts?.length) {
        await tx.customerContact.createMany({
          data: data.contacts.map((c) => ({
            customerId: created.id,
            type: c.type,
            value: c.value,
          })),
        });
      }

      // Create customer account
      await tx.customerAccount.create({
        data: { tenantId, customerId: created.id, balance: 0 },
      });

      return tx.customer.findUnique({
        where: { id: created.id },
        include: { addresses: true, contacts: true, customerAccount: true },
      });
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'CUSTOMER_CREATED',
      entity: 'Customer',
      entityId: customer!.id,
      newValue: customer,
    });

    this.logger.log(`Customer created: ${customer!.id}`);
    return customer;
  }

  async update(
    tenantId: string,
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      email?: string | null;
      tcNo?: string | null;
      notes?: string | null;
    },
    userId?: string,
  ) {
    const existing = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Müşteri bulunamadı.');
    }

    const updated = await this.prisma.customer.update({
      where: { id },
      data,
      include: { addresses: true, contacts: true },
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'CUSTOMER_UPDATED',
      entity: 'Customer',
      entityId: id,
      oldValue: existing,
      newValue: updated,
    });

    return updated;
  }

  async remove(tenantId: string, id: string, userId?: string) {
    const existing = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Müşteri bulunamadı.');
    }

    // Check for active service orders
    const activeOrders = await this.prisma.serviceOrder.count({
      where: {
        customerId: id,
        status: { notIn: ['DELIVERED', 'CANCELLED'] },
      },
    });

    if (activeOrders > 0) {
      throw new ConflictException(
        'Bu müşterinin aktif iş emirleri var. Silmeden önce iş emirlerini tamamlayın.',
      );
    }

    await this.prisma.customer.delete({ where: { id } });

    await this.auditService.log({
      tenantId,
      userId,
      action: 'CUSTOMER_DELETED',
      entity: 'Customer',
      entityId: id,
      oldValue: existing,
    });

    return { message: 'Müşteri başarıyla silindi.' };
  }
}
