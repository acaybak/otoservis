import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(tenantId: string, dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().setDate(new Date().getDate() - 30));
    const to = dateTo ? new Date(dateTo) : new Date();

    const [
      totalCustomers,
      totalVehicles,
      activeOrders,
      completedOrders,
      totalRevenue,
      pendingAppointments,
      lowStockProducts,
      recentOrders,
      ordersByStatus,
      monthlyRevenue,
      topServices,
    ] = await Promise.all([
      // Total customers
      this.prisma.customer.count({ where: { tenantId } }),
      // Total vehicles
      this.prisma.vehicle.count({ where: { tenantId } }),
      // Active orders
      this.prisma.serviceOrder.count({
        where: { tenantId, status: { notIn: ['DELIVERED', 'CANCELLED'] } },
      }),
      // Completed orders this period
      this.prisma.serviceOrder.count({
        where: {
          tenantId, status: 'DELIVERED',
          updatedAt: { gte: from, lte: to },
        },
      }),
      // Revenue this period
      this.prisma.serviceOrder.aggregate({
        where: {
          tenantId, status: 'DELIVERED',
          updatedAt: { gte: from, lte: to },
        },
        _sum: { totalAmount: true },
      }),
      // Pending appointments
      this.prisma.appointment.count({
        where: { tenantId, status: 'PENDING' },
      }),
      // Low stock products
      this.prisma.product.count({
        where: { tenantId, stock: { lte: this.prisma.product.fields.minStock } },
      }),
      // Recent orders
      this.prisma.serviceOrder.findMany({
        where: { tenantId },
        include: {
          customer: { select: { firstName: true, lastName: true } },
          vehicle: { select: { plate: true, brand: true, model: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Orders by status
      this.prisma.serviceOrder.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      // Monthly revenue (last 12 months)
      this.prisma.serviceOrder.findMany({
        where: {
          tenantId,
          status: 'DELIVERED',
          updatedAt: { gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
        },
        select: { totalAmount: true, updatedAt: true },
        orderBy: { updatedAt: 'asc' },
      }),
      // Top services (by frequency of parts)
      this.prisma.serviceOrderPart.groupBy({
        by: ['name'],
        _count: true,
        _sum: { total: true },
        orderBy: { _count: { name: 'desc' } },
      }),
    ]);

    // Group monthly revenue
    const revenueByMonth: Record<string, number> = {};
    for (const order of monthlyRevenue) {
      const month = `${order.updatedAt.getFullYear()}-${(order.updatedAt.getMonth() + 1).toString().padStart(2, '0')}`;
      revenueByMonth[month] = (revenueByMonth[month] || 0) + Number(order.totalAmount);
    }

    return {
      summary: {
        totalCustomers,
        totalVehicles,
        activeOrders,
        completedOrders,
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        pendingAppointments,
        lowStockProducts,
      },
      recentOrders,
      ordersByStatus,
      revenueByMonth,
      topServices: topServices.slice(0, 10),
    };
  }

  async getSalesReport(tenantId: string, dateFrom?: string, dateTo?: string, groupBy = 'month') {
    const from = dateFrom ? new Date(dateFrom) : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const to = dateTo ? new Date(dateTo) : new Date();

    const orders = await this.prisma.serviceOrder.findMany({
      where: {
        tenantId,
        status: 'DELIVERED',
        updatedAt: { gte: from, lte: to },
      },
      select: { totalAmount: true, discount: true, taxAmount: true, updatedAt: true },
      orderBy: { updatedAt: 'asc' },
    });

    const groups: Record<string, { count: number; revenue: number; discount: number; tax: number }> = {};

    for (const order of orders) {
      let key: string;
      const d = order.updatedAt;
      if (groupBy === 'day') {
        key = d.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      }

      if (!groups[key]) groups[key] = { count: 0, revenue: 0, discount: 0, tax: 0 };
      groups[key].count++;
      groups[key].revenue += Number(order.totalAmount);
      groups[key].discount += Number(order.discount);
      groups[key].tax += Number(order.taxAmount);
    }

    return { groupBy, data: groups };
  }
}
