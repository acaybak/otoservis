import { Controller, Get, Post, Param, Body, NotFoundException, Req, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { normalizePlate } from '@otoservis/shared';
import { Request } from 'express';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // Get tenant info by slug (for branding)
  @Get(':tenantSlug/info')
  async getTenantInfo(@Param('tenantSlug') tenantSlug: string) {
    const tenant = await this.publicService.getTenantInfo(tenantSlug);
    if (!tenant) {
      throw new NotFoundException('Firma bulunamadı.');
    }
    return tenant;
  }

  // Get available appointment slots
  @Get(':tenantSlug/appointments/slots')
  async getAvailableSlots(
    @Param('tenantSlug') tenantSlug: string,
    @Query('date') date: string,
  ) {
    const tenant = await this.publicService.getTenantInfo(tenantSlug);
    if (!tenant) {
      throw new NotFoundException('Firma bulunamadı.');
    }
    if (!date) {
      throw new NotFoundException('Tarih belirtilmelidir.');
    }
    return this.publicService.getAvailableSlots(tenant.id, date);
  }

  // Create public appointment
  @Post(':tenantSlug/appointments')
  async createAppointment(
    @Param('tenantSlug') tenantSlug: string,
    @Body() body: {
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
    },
  ) {
    const tenant = await this.publicService.getTenantInfo(tenantSlug);
    if (!tenant) {
      throw new NotFoundException('Firma bulunamadı.');
    }
    return this.publicService.createAppointment(tenant.id, body);
  }

  // Get vehicle history (subdomain or path-based)
  @Get(':tenantSlug/vehicle-history/:plate')
  async getVehicleHistory(
    @Param('tenantSlug') tenantSlug: string,
    @Param('plate') plate: string,
    @Req() req: Request,
  ) {
    // Extract tenant from subdomain or use path parameter
    const host = req.hostname || '';
    const subdomain = host.split('.')[0];
    
    // Try subdomain first, fall back to path parameter
    const tenantIdentifier = subdomain && subdomain !== 'portal' && subdomain !== 'www' 
      ? subdomain 
      : tenantSlug;

    const normalized = normalizePlate(plate);
    const result = await this.publicService.getVehicleHistory(tenantIdentifier, normalized);
    
    if (!result) {
      throw new NotFoundException('Bu plakaya kayıtlı araç bulunamadı.');
    }
    
    return result;
  }
}
