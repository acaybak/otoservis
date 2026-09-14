import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class LicensesService {
  private readonly logger = new Logger(LicensesService.name);

  constructor(private prisma: PrismaService) {}

  // Generate a unique license key: XXXX-XXXX-XXXX-XXXX
  private generateKey(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' as string;
    const segments: string[] = [];
    for (let s = 0; s < 4; s++) {
      let segment = '';
      for (let i = 0; i < 4; i++) {
        segment += chars[crypto.randomInt(chars.length)];
      }
      segments.push(segment);
    }
    return segments.join('-');
  }

  // Admin: Create a batch of license keys
  async createKeys(count: number, planType: string, maxUsers: number, duration: number, note?: string) {
    const keys: any[] = [];
    for (let i = 0; i < count; i++) {
      const key = await (this.prisma as any).licenseKey.create({
        data: {
          key: this.generateKey(),
          planType,
          maxUsers,
          duration,
          note: note || null,
          status: 'AVAILABLE',
        },
      });
      keys.push(key);
    }
    return keys;
  }

  // Admin: List all license keys
  async listKeys() {
    return (this.prisma as any).licenseKey.findMany({
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        license: { select: { id: true, status: true, expiresAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Public: Validate a license key (before activation)
  async validateKey(key: string) {
    const licenseKey = await (this.prisma as any).licenseKey.findUnique({
      where: { key: key.toUpperCase().trim() },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });

    if (!licenseKey) {
      throw new NotFoundException('Geçersiz lisans anahtarı.');
    }

    if (licenseKey.status === 'USED') {
      throw new BadRequestException('Bu lisans anahtarı zaten kullanılmış.');
    }

    if (licenseKey.status === 'EXPIRED') {
      throw new BadRequestException('Bu lisans anahtarı süresi dolmuş.');
    }

    return {
      valid: true,
      planType: licenseKey.planType,
      maxUsers: licenseKey.maxUsers,
      duration: licenseKey.duration,
      tenant: licenseKey.tenant,
    };
  }

  // Public: Activate a license key for a tenant
  async activateKey(key: string, tenantId: string, machineId: string) {
    const normalizedKey = key.toUpperCase().trim();

    const licenseKey = await (this.prisma as any).licenseKey.findUnique({
      where: { key: normalizedKey },
    });

    if (!licenseKey) {
      throw new NotFoundException('Geçersiz lisans anahtarı.');
    }

    if (licenseKey.status === 'USED') {
      throw new ConflictException('Bu lisans anahtarı zaten kullanılmış.');
    }

    // Check if tenant already has a license
    const existingLicense = await (this.prisma as any).license.findUnique({
      where: { tenantId },
    });

    if (existingLicense) {
      throw new ConflictException('Bu hesap zaten bir lisansa sahip.');
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + licenseKey.duration);

    // Create the license
    const license = await (this.prisma as any).license.create({
      data: {
        tenantId,
        licenseKey: normalizedKey,
        planType: licenseKey.planType,
        maxUsers: licenseKey.maxUsers,
        status: 'ACTIVE',
        activatedAt: now,
        expiresAt,
        machineId,
      },
    });

    // Update the key
    await (this.prisma as any).licenseKey.update({
      where: { id: licenseKey.id },
      data: {
        status: 'USED',
        tenantId,
        licenseId: license.id,
        activatedAt: now,
      },
    });

    return {
      id: license.id,
      planType: license.planType,
      maxUsers: license.maxUsers,
      activatedAt: license.activatedAt,
      expiresAt: license.expiresAt,
      status: license.status,
    };
  }

  // Public: Check license status for a tenant
  async checkLicense(tenantId: string) {
    const license = await (this.prisma as any).license.findUnique({
      where: { tenantId },
    });

    if (!license) {
      return {
        hasLicense: false,
        status: 'NONE',
      };
    }

    // Check if expired
    const now = new Date();
    if (license.expiresAt && license.expiresAt < now) {
      // Update status to EXPIRED
      await (this.prisma as any).license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' },
      });
      return {
        hasLicense: true,
        status: 'EXPIRED',
        planType: license.planType,
        maxUsers: license.maxUsers,
        expiresAt: license.expiresAt,
      };
    }

    return {
      hasLicense: true,
      status: license.status,
      planType: license.planType,
      maxUsers: license.maxUsers,
      activatedAt: license.activatedAt,
      expiresAt: license.expiresAt,
    };
  }

  // Admin: Suspend/Activate a license
  async updateLicenseStatus(licenseId: string, status: string) {
    return (this.prisma as any).license.update({
      where: { id: licenseId },
      data: { status },
    });
  }

  // Admin: Get all licenses
  async listLicenses() {
    return (this.prisma as any).license.findMany({
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
