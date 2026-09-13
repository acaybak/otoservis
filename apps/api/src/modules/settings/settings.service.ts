import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@otoservis/database';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.tenantSetting.findMany({ where: { tenantId } });
  }

  async findOne(tenantId: string, key: string) {
    const setting = await this.prisma.tenantSetting.findFirst({ where: { tenantId, key } });
    if (!setting) throw new NotFoundException(`Ayar bulunamadı: ${key}`);
    return setting;
  }

  async upsert(tenantId: string, key: string, value: unknown) {
    return this.prisma.tenantSetting.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { value: value as Prisma.InputJsonValue },
      create: { tenantId, key, value: value as Prisma.InputJsonValue },
    });
  }

  async bulkUpsert(tenantId: string, settings: Record<string, unknown>) {
    const results = await Promise.all(
      Object.entries(settings).map(([key, value]) =>
        this.prisma.tenantSetting.upsert({
          where: { tenantId_key: { tenantId, key } },
          update: { value: value as Prisma.InputJsonValue },
          create: { tenantId, key, value: value as Prisma.InputJsonValue },
        }),
      ),
    );
    return results;
  }

  async remove(tenantId: string, key: string) {
    const setting = await this.prisma.tenantSetting.findFirst({ where: { tenantId, key } });
    if (!setting) throw new NotFoundException(`Ayar bulunamadı: ${key}`);
    await this.prisma.tenantSetting.delete({ where: { id: setting.id } });
    return { message: 'Ayar silindi.' };
  }

  // Roles management for tenant
  async findRoles(tenantId: string) {
    return this.prisma.role.findMany({
      where: { OR: [{ tenantId }, { tenantId: null }] },
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findPermissions() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }
}
