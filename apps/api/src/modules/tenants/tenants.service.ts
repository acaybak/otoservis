import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@otoservis/database';
import { TenantResponse } from '@otoservis/types';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; slug: string }): Promise<TenantResponse> {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException('Bu slug zaten kullanılıyor.');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        status: 'ACTIVE',
      },
    });

    this.logger.log(`Tenant created: ${tenant.name} (${tenant.id})`);

    return this.toResponse(tenant);
  }

  async findAll(): Promise<TenantResponse[]> {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return tenants.map((t) => this.toResponse(t));
  }

  async findOne(id: string): Promise<TenantResponse> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException('Servis bulunamadı.');
    }

    return this.toResponse(tenant);
  }

  async update(
    id: string,
    data: { name?: string; slug?: string; status?: string; settings?: Record<string, unknown> },
  ): Promise<TenantResponse> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Servis bulunamadı.');
    }

    if (data.slug && data.slug !== tenant.slug) {
      const existing = await this.prisma.tenant.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new ConflictException('Bu slug zaten kullanılıyor.');
      }
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.settings !== undefined && { settings: data.settings as Prisma.InputJsonValue }),
      },
    });

    return this.toResponse(updated);
  }

  async setup(data: {
    tenantName: string;
    tenantSlug: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName: string;
    adminLastName: string;
    adminPhone?: string;
  }): Promise<{ tenant: TenantResponse; message: string }> {
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug: data.tenantSlug },
    });

    if (existingSlug) {
      throw new ConflictException('Bu slug zaten kullanılıyor.');
    }

    const existingEmail = await this.prisma.user.findFirst({
      where: { email: data.adminEmail.toLowerCase() },
    });

    if (existingEmail) {
      throw new ConflictException('Bu e-posta adresi zaten kullanılıyor.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          slug: data.tenantSlug,
          status: 'ACTIVE',
        },
      });

      const passwordHash = await bcrypt.hash(data.adminPassword, 12);

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.adminEmail.toLowerCase(),
          passwordHash,
          firstName: data.adminFirstName,
          lastName: data.adminLastName,
          phone: data.adminPhone || null,
          status: 'ACTIVE',
        },
      });

      const ownerRole = await tx.role.findFirst({
        where: { name: 'TENANT_OWNER', tenantId: null },
      });

      if (ownerRole) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: ownerRole.id },
        });
      }

      this.logger.log(`Tenant setup completed: ${tenant.name} with admin ${user.email}`);

      return this.toResponse(tenant);
    });

    return {
      tenant: result,
      message: 'Servis hesabı ve yönetici kullanıcı başarıyla oluşturuldu.',
    };
  }

  private toResponse(tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): TenantResponse {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    };
  }
}
