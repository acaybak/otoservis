import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  async getSystemStats() {
    const [
      tenantCount,
      userCount,
      customerCount,
      vehicleCount,
      serviceOrderCount,
      activeTenants,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.user.count(),
      this.prisma.customer.count(),
      this.prisma.vehicle.count(),
      this.prisma.serviceOrder.count(),
      this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      tenantCount,
      activeTenants,
      userCount,
      customerCount,
      vehicleCount,
      serviceOrderCount,
    };
  }

  async getTenantsWithStats() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            vehicles: true,
            serviceOrders: true,
          },
        },
      },
    });

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      stats: {
        userCount: t._count.users,
        customerCount: t._count.customers,
        vehicleCount: t._count.vehicles,
        serviceOrderCount: t._count.serviceOrders,
      },
    }));
  }

  async getTenantDetail(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            customers: true,
            vehicles: true,
            serviceOrders: true,
          },
        },
      },
    });

    if (!tenant) throw new NotFoundException('Tenant bulunamadı.');

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      createdAt: tenant.createdAt.toISOString(),
      stats: {
        userCount: tenant.users.length,
        customerCount: tenant._count.customers,
        vehicleCount: tenant._count.vehicles,
        serviceOrderCount: tenant._count.serviceOrders,
      },
      users: tenant.users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
      })),
    };
  }

  async updateTenantStatus(id: string, status: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { status },
    });
  }

  // Tenant içindeki tüm verileri getir
  async getTenantData(tenantId: string, dataType: string) {
    switch (dataType) {
      case 'customers':
        return this.prisma.customer.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
      case 'vehicles':
        return this.prisma.vehicle.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
      case 'service-orders':
        return this.prisma.serviceOrder.findMany({
          where: { tenantId },
          include: { customer: true, vehicle: true },
          orderBy: { createdAt: 'desc' },
        });
      case 'users':
        return this.prisma.user.findMany({
          where: { tenantId },
          select: { id: true, email: true, firstName: true, lastName: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });
      default:
        throw new NotFoundException('Geçersiz veri tipi.');
    }
  }

  // Tenant içindeki herhangi bir veriyi güncelle
  async updateTenantData(tenantId: string, dataType: string, id: string, data: any) {
    switch (dataType) {
      case 'customers':
        return this.prisma.customer.update({ where: { id, tenantId }, data });
      case 'vehicles':
        return this.prisma.vehicle.update({ where: { id, tenantId }, data });
      case 'service-orders':
        return this.prisma.serviceOrder.update({ where: { id, tenantId }, data });
      case 'users':
        return this.prisma.user.update({ where: { id, tenantId }, data });
      default:
        throw new NotFoundException('Geçersiz veri tipi.');
    }
  }

  // Tenant içindeki herhangi bir veriyi sil
  async deleteTenantData(tenantId: string, dataType: string, id: string) {
    switch (dataType) {
      case 'customers':
        return this.prisma.customer.delete({ where: { id, tenantId } });
      case 'vehicles':
        return this.prisma.vehicle.delete({ where: { id, tenantId } });
      case 'service-orders':
        return this.prisma.serviceOrder.delete({ where: { id, tenantId } });
      case 'users':
        return this.prisma.user.delete({ where: { id, tenantId } });
      default:
        throw new NotFoundException('Geçersiz veri tipi.');
    }
  }

  // Tenant'a yeni kullanıcı ekle
  async createTenantUser(tenantId: string, data: { email: string; password: string; firstName: string; lastName: string }) {
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        tenantId,
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        status: 'ACTIVE',
      },
    });
  }
}
