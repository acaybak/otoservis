import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getTenantInfo(tenantSlug: string) {
    // Find tenant by slug (using name as slug for now)
    const tenant = await (this.prisma as any).tenant.findFirst({
      where: {
        OR: [
          { id: tenantSlug },
          { name: { contains: tenantSlug, mode: 'insensitive' } },
          { slug: tenantSlug },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!tenant) return null;

    // Get settings for branding
    const settings = await (this.prisma as any).tenantSetting.findMany({
      where: { tenantId: tenant.id },
      select: { key: true, value: true },
    });

    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      try {
        settingsMap[s.key] = typeof s.value === 'string' ? s.value : JSON.parse(JSON.stringify(s.value));
      } catch {
        settingsMap[s.key] = s.value;
      }
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug || tenantSlug,
      logo: settingsMap.logo || null,
      primaryColor: settingsMap.primaryColor || '#3b82f6',
      phone: settingsMap.phone || null,
      address: settingsMap.address || null,
    };
  }

  async getVehicleHistory(tenantSlug: string, plateNormalized: string) {
    // Find tenant by slug
    const tenant = await (this.prisma as any).tenant.findFirst({
      where: {
        OR: [
          { id: tenantSlug },
          { name: { contains: tenantSlug, mode: 'insensitive' } },
          { slug: tenantSlug },
        ],
      },
      select: { id: true, name: true },
    });

    if (!tenant) return null;

    // Find vehicle by normalized plate WITHIN this tenant
    const vehicle = await (this.prisma as any).vehicle.findFirst({
      where: { 
        plateNormalized,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        plate: true,
        brand: true,
        model: true,
        year: true,
        km: true,
        fuelType: true,
        transmission: true,
        color: true,
      },
    });

    if (!vehicle) return null;

    // Get maintenance records with items (filtered by tenant)
    const maintenanceRecords = await (this.prisma as any).maintenanceRecord.findMany({
      where: { 
        vehicleId: vehicle.id,
        tenantId: tenant.id,
      },
      include: {
        maintenanceType: { select: { name: true } },
        items: {
          select: {
            itemType: true,
            name: true,
            quantity: true,
            unitPrice: true,
            total: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { performedAt: 'desc' },
    });

    // Get service orders (filtered by tenant)
    const serviceOrders = await (this.prisma as any).serviceOrder.findMany({
      where: { 
        vehicleId: vehicle.id,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        diagnosis: true,
        totalAmount: true,
        createdAt: true,
        parts: {
          select: { name: true, quantity: true, unitPrice: true, total: true },
        },
        labor: {
          select: { description: true, hours: true, hourlyRate: true, total: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get vehicle maintenance schedules (filtered by tenant)
    const vehicleMaintenances = await (this.prisma as any).vehicleMaintenance.findMany({
      where: { 
        vehicleId: vehicle.id,
        tenantId: tenant.id,
      },
      include: {
        maintenanceType: { select: { name: true } },
      },
    });

    // Calculate summary
    const totalMaintenance = maintenanceRecords.reduce(
      (sum: number, r: any) => sum + Number(r.totalAmount || 0),
      0,
    );
    const totalServiceOrders = serviceOrders.reduce(
      (sum: number, o: any) => sum + Number(o.totalAmount || 0),
      0,
    );
    const lastMaintenance = maintenanceRecords[0]?.performedAt || null;
    const lastKm = maintenanceRecords[0]?.km || vehicle.km;

    // Calculate next due maintenance
    const nextDue = vehicleMaintenances
      .filter((i: any) => i.lastKm != null || i.lastDate != null)
      .map((i: any) => {
        const intervalKm = i.intervalKm;
        const intervalDays = i.intervalDays;
        const nextDueKm = i.lastKm != null && intervalKm != null ? i.lastKm + intervalKm : null;
        const nextDueDate = i.lastDate && intervalDays != null
          ? new Date(new Date(i.lastDate).getTime() + intervalDays * 86400000).toISOString().split('T')[0]
          : null;
        return {
          typeName: i.maintenanceType.name,
          nextDueKm,
          nextDueDate,
          lastKm: i.lastKm,
          lastPerformedAt: i.lastDate,
        };
      })
      .sort((a: any, b: any) => {
        if (a.nextDueKm && b.nextDueKm) return a.nextDueKm - b.nextDueKm;
        if (a.nextDueKm) return -1;
        if (b.nextDueKm) return 1;
        return 0;
      });

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      vehicle,
      maintenanceRecords,
      serviceOrders,
      maintenanceSchedule: nextDue,
      summary: {
        totalMaintenance,
        totalServiceOrders,
        totalSpent: totalMaintenance + totalServiceOrders,
        maintenanceCount: maintenanceRecords.length,
        serviceOrderCount: serviceOrders.length,
        lastMaintenance,
        lastKm,
      },
    };
  }

  // ==========================================================================
  // Public Appointment Methods
  // ==========================================================================

  async getAvailableSlots(tenantId: string, date: string) {
    // Get working hours from settings (default 09:00 - 18:00)
    const settings = await (this.prisma as any).tenantSetting.findMany({
      where: { tenantId },
      select: { key: true, value: true },
    });

    const settingsMap: Record<string, any> = {};
    for (const s of settings) {
      try {
        settingsMap[s.key] = typeof s.value === 'string' ? s.value : JSON.parse(JSON.stringify(s.value));
      } catch {
        settingsMap[s.key] = s.value;
      }
    }

    const workStart = parseInt(settingsMap.workStartHour || '9', 10);
    const workEnd = parseInt(settingsMap.workEndHour || '18', 10);
    const slotDuration = parseInt(settingsMap.appointmentSlotMinutes || '60', 10);

    // Get existing appointments for this date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const existingAppointments = await (this.prisma as any).appointment.findMany({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: { time: true },
    });

    const bookedTimes = existingAppointments.map((a: any) => a.time);

    // Generate available slots
    const slots: string[] = [];
    for (let hour = workStart; hour < workEnd; hour++) {
      for (let min = 0; min < 60; min += slotDuration) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        if (!bookedTimes.includes(timeStr)) {
          slots.push(timeStr);
        }
      }
    }

    return {
      date,
      availableSlots: slots,
      workHours: { start: workStart, end: workEnd },
      slotDuration,
    };
  }

  async createAppointment(tenantId: string, data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    plate: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    date: string;
    time: string;
    serviceType?: string;
    notes?: string;
  }) {
    // Find or create customer
    let customer = await (this.prisma as any).customer.findFirst({
      where: { tenantId, phone: data.customerPhone },
    });

    if (!customer) {
      const nameParts = data.customerName.trim().split(' ');
      customer = await (this.prisma as any).customer.create({
        data: {
          tenantId,
          firstName: nameParts[0] || data.customerName,
          lastName: nameParts.slice(1).join(' ') || '',
          phone: data.customerPhone,
          email: data.customerEmail || null,
        },
      });
    }

    // Find or create vehicle
    const plateNormalized = data.plate.replace(/\s+/g, '').toUpperCase();
    let vehicle = await (this.prisma as any).vehicle.findFirst({
      where: { tenantId, plateNormalized },
    });

    if (!vehicle) {
      vehicle = await (this.prisma as any).vehicle.create({
        data: {
          tenantId,
          plate: plateNormalized,
          plateNormalized,
          brand: data.vehicleBrand || null,
          model: data.vehicleModel || null,
        },
      });
    }

    // Create appointment
    const appointment = await (this.prisma as any).appointment.create({
      data: {
        tenantId,
        customerId: customer.id,
        vehicleId: vehicle.id,
        plate: plateNormalized,
        phone: data.customerPhone,
        service: data.serviceType || null,
        date: new Date(data.date),
        time: data.time,
        notes: data.notes || null,
        status: 'PENDING',
        source: 'PORTAL',
      },
    });

    // Create status history
    await (this.prisma as any).appointmentStatusHistory.create({
      data: {
        appointmentId: appointment.id,
        toStatus: 'PENDING',
        note: 'Online randevu oluşturuldu.',
      },
    });

    return {
      id: appointment.id,
      date: data.date,
      time: data.time,
      status: 'PENDING',
      customerName: data.customerName,
      plate: data.plate,
      message: 'Randevunuz başarıyla oluşturuldu. En kısa sürede onaylanacaktır.',
    };
  }
}
