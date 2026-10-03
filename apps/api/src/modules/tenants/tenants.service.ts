import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@otoservis/database';
import { TenantResponse } from '@otoservis/types';
import {
  TRIAL_DAYS,
  buildTrialInfo,
  TrialInfo,
} from '../../common/services/license-status.helper';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

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
        trialEndsAt: this.trialEndsAtFor(),
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

  async findMe(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) {
      throw new NotFoundException('Servis bulunamadı.');
    }

    const logo = await this.getLogoSetting(tenantId);
    const license = await this.getLicenseInfo(tenantId);
    const trial = buildTrialInfo(tenant.trialEndsAt, license.status === 'ACTIVE');
    return this.toProfile(tenant, logo, license, trial);
  }

  async updateMe(
    tenantId: string,
    data: {
      name?: string;
      phone?: string | null;
      email?: string | null;
      address?: string | null;
      city?: string | null;
      website?: string | null;
      logo?: string | null;
    },
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    if (!tenant) {
      throw new NotFoundException('Servis bulunamadı.');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.city !== undefined && { city: data.city || null }),
        ...(data.website !== undefined && { website: data.website || null }),
      },
    });

    // Logo, tenant_settings tablosunda 'logo' anahtarıyla saklanır (müşteri portalı buradan okur)
    if (data.logo !== undefined) {
      if (data.logo) {
        await this.prisma.tenantSetting.upsert({
          where: { tenantId_key: { tenantId, key: 'logo' } },
          create: { tenantId, key: 'logo', value: data.logo },
          update: { value: data.logo },
        });
      } else {
        await this.prisma.tenantSetting.deleteMany({ where: { tenantId, key: 'logo' } });
      }
    }

    const logo = await this.getLogoSetting(tenantId);
    const license = await this.getLicenseInfo(tenantId);
    // getLicenseInfo süresi geçmiş lisansı zaten EXPIRED işaretlediği için
    // status === 'ACTIVE' kontrolü yeterlidir
    const trial = buildTrialInfo(updated.trialEndsAt, license.status === 'ACTIVE');
    this.logger.log(`Tenant profile updated: ${updated.name} (${updated.id})`);
    return this.toProfile(updated, logo, license, trial);
  }

  // Tamirhane logosu tenant_settings tablosunda 'logo' anahtarıyla saklanır
  private async getLogoSetting(tenantId: string): Promise<string | null> {
    const row = await this.prisma.tenantSetting.findUnique({
      where: { tenantId_key: { tenantId, key: 'logo' } },
    });
    if (!row || row.value == null) return null;
    return typeof row.value === 'string' ? row.value : null;
  }

  // Lisans bilgisi: masaüstü Ayarlar sayfasında süre/plan/durum göstermek için profile eklenir
  private async getLicenseInfo(tenantId: string) {
    const empty = {
      hasLicense: false,
      status: 'NONE' as string,
      planType: null as string | null,
      maxUsers: null as number | null,
      daysLeft: null as number | null,
      activatedAt: null as string | null,
      expiresAt: null as string | null,
      licenseKey: null as string | null,
    };

    let license: any = null;
    try {
      license = await (this.prisma as any).license.findUnique({ where: { tenantId } });
    } catch {
      // Şema istemcisi lisans modellerini içermiyorsa profil yüklenmeye devam eder
      return empty;
    }
    if (!license) return empty;

    const now = new Date();
    let status: string = license.status;
    // Süresi geçmiş ACTIVE lisansları okuma sırasında EXPIRED'a çevir (lisans kontrolü ile aynı davranış)
    if (status === 'ACTIVE' && license.expiresAt && new Date(license.expiresAt) < now) {
      status = 'EXPIRED';
      try {
        await (this.prisma as any).license.update({ where: { id: license.id }, data: { status: 'EXPIRED' } });
      } catch {
        // Durum güncellenemese de güncel bilgi dönülür
      }
    }

    const daysLeft = license.expiresAt
      ? Math.max(0, Math.ceil((new Date(license.expiresAt).getTime() - now.getTime()) / 86400000))
      : null;

    return {
      hasLicense: true,
      status,
      planType: license.planType || null,
      maxUsers: typeof license.maxUsers === 'number' ? license.maxUsers : null,
      daysLeft,
      activatedAt: license.activatedAt ? new Date(license.activatedAt).toISOString() : null,
      expiresAt: license.expiresAt ? new Date(license.expiresAt).toISOString() : null,
      licenseKey: license.licenseKey || null,
    };
  }

  async setup(data: {
    tenantName: string;
    tenantSlug: string;
    adminEmail: string;
    adminPassword: string;
    adminFirstName: string;
    adminLastName: string;
    adminPhone?: string;
    phone?: string;
    address?: string;
    city?: string;
  }): Promise<{ tenant: TenantResponse; message: string }> {
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug: data.tenantSlug },
    });

    if (existingSlug) {
      throw new ConflictException('Bu firma adı zaten kullanılıyor. Lütfen farklı bir firma adı seçin.');
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
          phone: data.phone || null,
          address: data.address || null,
          city: data.city || null,
          // Yönetici (ADMIN_EMAILS) firmaları deneme kapsamı dışındadır
          trialEndsAt: this.trialEndsAtFor(data.adminEmail),
        },
      });

      const passwordHash = await bcrypt.hash(data.adminPassword, 10);

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

  // Yeni firma için deneme bitişi: kayıt + 7 gün. Yönetici e-postaları
  // (ADMIN_EMAILS) hariçtir; onlar lisanssız da kısıtlanmaz.
  private trialEndsAtFor(adminEmail?: string): Date | null {
    if (adminEmail) {
      const raw = this.configService.get<string>('ADMIN_EMAILS') || '';
      const admins = raw
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (admins.includes(adminEmail.toLowerCase())) return null;
    }
    const ends = new Date();
    ends.setDate(ends.getDate() + TRIAL_DAYS);
    return ends;
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

  private toProfile(
    tenant: {
      id: string;
      name: string;
      slug: string;
      status: string;
      phone: string | null;
      email: string | null;
      address: string | null;
      city: string | null;
      taxNumber: string | null;
      website: string | null;
      trialEndsAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    logo: string | null = null,
    license: any = null,
    trial: TrialInfo | null = null,
  ) {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      phone: tenant.phone,
      email: tenant.email,
      address: tenant.address,
      city: tenant.city,
      taxNumber: tenant.taxNumber,
      website: tenant.website,
      logo,
      license,
      trial,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    };
  }
}
