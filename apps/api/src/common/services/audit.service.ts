import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@otoservis/database';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    tenantId: string;
    userId?: string;
    action: string;
    entity: string;
    entityId: string;
    oldValue?: unknown;
    newValue?: unknown;
    device?: string;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue as Prisma.InputJsonValue | undefined,
        newValue: params.newValue as Prisma.InputJsonValue | undefined,
        device: params.device,
        ipAddress: params.ipAddress,
      },
    });
  }

  async findByEntity(
    tenantId: string,
    entity: string,
    entityId: string,
  ) {
    return this.prisma.auditLog.findMany({
      where: { tenantId, entity, entityId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findByTenant(
    tenantId: string,
    pagination: { skip: number; take: number },
    filters?: { entity?: string; userId?: string; action?: string },
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (filters?.entity) where.entity = filters.entity;
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.action) where.action = filters.action;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total };
  }
}
