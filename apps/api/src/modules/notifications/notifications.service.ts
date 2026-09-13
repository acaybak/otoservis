import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@otoservis/database';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, userId?: string, unreadOnly = false) {
    const where: Record<string, unknown> = { tenantId };
    if (userId) where.userId = userId;
    if (unreadOnly) where.isRead = false;

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async create(tenantId: string, data: {
    userId?: string; type: string; title: string; message: string; data?: Record<string, unknown>;
  }) {
    return this.prisma.notification.create({
      data: {
        tenantId,
        userId: data.userId || null,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async markAsRead(notificationId: string, tenantId: string) {
    const n = await this.prisma.notification.findFirst({ where: { id: notificationId, tenantId } });
    if (!n) throw new NotFoundException('Bildirim bulunamadı.');
    return this.prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  }

  async markAllAsRead(tenantId: string, userId?: string) {
    const where: Record<string, unknown> = { tenantId, isRead: false };
    if (userId) where.userId = userId;
    await this.prisma.notification.updateMany({ where, data: { isRead: true } });
    return { message: 'Tüm bildirimler okundu olarak işaretlendi.' };
  }

  async getUnreadCount(tenantId: string, userId?: string) {
    const where: Record<string, unknown> = { tenantId, isRead: false };
    if (userId) where.userId = userId;
    const count = await this.prisma.notification.count({ where });
    return { count };
  }
}
