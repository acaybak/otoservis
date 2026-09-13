import { Injectable, Logger } from '@nestjs/common';
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

    if (!tenant) return null;

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
}
