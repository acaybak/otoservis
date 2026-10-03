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
  // - İlk aktivasyon: boşta (AVAILABLE) anahtar ile lisans oluşturulur
  // - Yeniden kurulum: aynı anahtar tekrar girilirse mevcut lisans döndürülür (cihaz güncellenir)
  // - Yenileme/yükseltme: mevcut lisans varken yeni anahtar girilirse süre uzatılır
  async activateKey(key: string, tenantId: string, machineId: string) {
    const normalizedKey = key.toUpperCase().trim();
    const prisma = this.prisma as any;

    const licenseKey = await prisma.licenseKey.findUnique({
      where: { key: normalizedKey },
    });

    if (!licenseKey) {
      throw new NotFoundException('Geçersiz lisans anahtarı.');
    }

    if (licenseKey.status === 'EXPIRED') {
      throw new BadRequestException('Bu lisans anahtarı süresi dolmuş.');
    }

    const existingLicense = await prisma.license.findUnique({
      where: { tenantId },
    });

    const now = new Date();

    // Kullanılmış anahtar: yalnızca aynı lisansın tekrar aktivasyonu (örn. yeniden kurulum) kabul edilir
    if (licenseKey.status === 'USED') {
      if (existingLicense && existingLicense.licenseKey === normalizedKey) {
        const expired = existingLicense.expiresAt && new Date(existingLicense.expiresAt) < now;
        const license = await prisma.license.update({
          where: { id: existingLicense.id },
          data: {
            machineId,
            ...(expired && existingLicense.status === 'ACTIVE' ? { status: 'EXPIRED' } : {}),
          },
        });
        this.logger.log(`License re-activated for tenant ${tenantId} (${normalizedKey})`);
        return {
          id: license.id,
          planType: license.planType,
          maxUsers: license.maxUsers,
          activatedAt: license.activatedAt,
          expiresAt: license.expiresAt,
          status: license.status,
        };
      }
      throw new ConflictException('Bu lisans anahtarı zaten kullanılmış.');
    }

    // Yenileme: yeni anahtar mevcut lisansın üzerine uygulanır, süre mevcut bitişten itibaren uzatılır
    if (existingLicense) {
      const base = existingLicense.expiresAt && new Date(existingLicense.expiresAt) > now
        ? new Date(existingLicense.expiresAt)
        : now;
      const expiresAt = new Date(base);
      expiresAt.setDate(expiresAt.getDate() + licenseKey.duration);

      const license = await prisma.license.update({
        where: { id: existingLicense.id },
        data: {
          licenseKey: normalizedKey,
          planType: licenseKey.planType,
          maxUsers: licenseKey.maxUsers,
          status: 'ACTIVE',
          activatedAt: existingLicense.activatedAt || now,
          expiresAt,
          machineId,
        },
      });

      // Eski anahtarın bağlantısı çözülür (license_id tekildir), yeni anahtar işaretlenir
      await prisma.licenseKey.updateMany({
        where: { licenseId: license.id },
        data: { licenseId: null },
      });
      await prisma.licenseKey.update({
        where: { id: licenseKey.id },
        data: { status: 'USED', tenantId, licenseId: license.id, activatedAt: now },
      });

      this.logger.log(`License renewed for tenant ${tenantId}: ${normalizedKey} until ${expiresAt.toISOString()}`);
      return {
        id: license.id,
        planType: license.planType,
        maxUsers: license.maxUsers,
        activatedAt: license.activatedAt,
        expiresAt: license.expiresAt,
        status: license.status,
      };
    }

    // İlk aktivasyon
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + licenseKey.duration);

    const license = await prisma.license.create({
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

    await prisma.licenseKey.update({
      where: { id: licenseKey.id },
      data: {
        status: 'USED',
        tenantId,
        licenseId: license.id,
        activatedAt: now,
      },
    });

    this.logger.log(`License activated for tenant ${tenantId}: ${normalizedKey} until ${expiresAt.toISOString()}`);

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
  async checkLicense(tenantId: string, machineId?: string) {
    const license = await (this.prisma as any).license.findUnique({
      where: { tenantId },
    });

    if (!license) {
      return {
        hasLicense: false,
        status: 'NONE',
      };
    }

    // Validate machine ID if provided and license has one
    if (machineId && license.machineId && license.machineId !== machineId) {
      return {
        hasLicense: true,
        status: 'INVALID_MACHINE',
        planType: license.planType,
        maxUsers: license.maxUsers,
        expiresAt: license.expiresAt,
        error: 'Bu lisans farklı bir cihaza bağlı.',
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
      machineId: license.machineId,
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
