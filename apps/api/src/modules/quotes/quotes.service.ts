import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QuotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, pagination: { skip?: number; take?: number }, filters?: { status?: string; customerId?: string }) {
    const where: any = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.customerId) where.customerId = filters.customerId;

    const [data, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        include: { customer: { select: { id: true, firstName: true, lastName: true, phone: true } }, vehicle: { select: { id: true, plate: true, brand: true, model: true } }, items: true },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.quote.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(tenantId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
      include: { customer: true, vehicle: true, items: true },
    });
    if (!quote) throw new NotFoundException('Teklif bulunamadı');
    return quote;
  }

  async create(tenantId: string, data: any) {
    const { items, ...quoteData } = data;
    const quoteNumber = `Q-${Date.now()}`;
    
    return this.prisma.quote.create({
      data: {
        ...quoteData,
        tenantId,
        quoteNumber,
        items: items ? { create: items } : undefined,
      },
      include: { items: true },
    });
  }

  async update(tenantId: string, id: string, data: any) {
    const existing = await this.prisma.quote.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Teklif bulunamadı');

    const { items, ...quoteData } = data;
    
    if (items) {
      await this.prisma.quoteItem.deleteMany({ where: { quoteId: id } });
    }

    return this.prisma.quote.update({
      where: { id },
      data: {
        ...quoteData,
        items: items ? { create: items } : undefined,
      },
      include: { items: true },
    });
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.prisma.quote.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Teklif bulunamadı');
    return this.prisma.quote.delete({ where: { id } });
  }

  async changeStatus(tenantId: string, id: string, status: string) {
    const existing = await this.prisma.quote.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Teklif bulunamadı');
    return this.prisma.quote.update({ where: { id }, data: { status } });
  }
}
