import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  async findAll(
    tenantId: string,
    pagination: { skip: number; take: number },
    filters?: { date?: string; dateFrom?: string; dateTo?: string; technicianId?: string; status?: string },
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.technicianId) where.technicianId = filters.technicianId;
    if (filters?.date) {
      const d = new Date(filters.date);
      where.date = { gte: new Date(d.setHours(0, 0, 0, 0)), lte: new Date(d.setHours(23, 59, 59, 999)) };
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.date = {};
      if (filters.dateFrom) (where.date as any).gte = new Date(filters.dateFrom);
      if (filters.dateTo) (where.date as any).lte = new Date(filters.dateTo);
    }

    const [data, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
          vehicle: { select: { id: true, plate: true, brand: true, model: true } },
          technician: { select: { id: true, firstName: true, lastName: true } },
        },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { date: 'asc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(tenantId: string, id: string) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        vehicle: true,
        technician: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!appt) throw new NotFoundException('Randevu bulunamadı.');
    return appt;
  }

  async create(tenantId: string, data: Record<string, unknown>, userId: string) {
    if (data.date) data.date = new Date(data.date as string);
    const appt = await this.prisma.appointment.create({
      data: { ...data, tenantId, status: 'PENDING' } as any,
    });

    await this.prisma.appointmentStatusHistory.create({
      data: { appointmentId: appt.id, toStatus: 'PENDING', note: 'Randevu oluşturuldu.' },
    });

    await this.auditService.log({
      tenantId, userId,
      action: 'APPOINTMENT_CREATED', entity: 'Appointment', entityId: appt.id, newValue: appt,
    });
    return appt;
  }

  async update(tenantId: string, id: string, data: Record<string, unknown>) {
    const existing = await this.prisma.appointment.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Randevu bulunamadı.');
    if (data.date) data.date = new Date(data.date as string);
    return this.prisma.appointment.update({ where: { id }, data });
  }

  async changeStatus(tenantId: string, id: string, status: string, userId: string, note?: string) {
    const existing = await this.prisma.appointment.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Randevu bulunamadı.');
    const oldStatus = existing.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.update({ where: { id }, data: { status } });
      await tx.appointmentStatusHistory.create({
        data: { appointmentId: id, fromStatus: oldStatus, toStatus: status, note: note || null },
      });
      return appt;
    });

    await this.auditService.log({
      tenantId, userId,
      action: 'APPOINTMENT_STATUS_CHANGED', entity: 'Appointment', entityId: id,
      oldValue: { status: oldStatus }, newValue: { status },
    });
    return updated;
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.appointment.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Randevu bulunamadı.');
    await this.prisma.appointment.delete({ where: { id } });
    return { message: 'Randevu silindi.' };
  }
}
