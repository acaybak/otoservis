import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ConfigService } from '@nestjs/config';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly configService: ConfigService,
  ) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getSystemStats();
  }

  @Get('tenants')
  async getTenants() {
    return this.adminService.getTenantsWithStats();
  }

  @Get('tenants/:id')
  async getTenantDetail(@Param('id') id: string) {
    return this.adminService.getTenantDetail(id);
  }

  @Patch('tenants/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.adminService.updateTenantStatus(id, body.status);
  }

  // Tenant içindeki verileri getir
  @Get('tenants/:tenantId/data/:dataType')
  async getTenantData(
    @Param('tenantId') tenantId: string,
    @Param('dataType') dataType: string,
  ) {
    return this.adminService.getTenantData(tenantId, dataType);
  }

  // Tenant içindeki veriyi güncelle
  @Patch('tenants/:tenantId/data/:dataType/:id')
  async updateTenantData(
    @Param('tenantId') tenantId: string,
    @Param('dataType') dataType: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.adminService.updateTenantData(tenantId, dataType, id, body);
  }

  // Tenant içindeki veriyi sil
  @Delete('tenants/:tenantId/data/:dataType/:id')
  async deleteTenantData(
    @Param('tenantId') tenantId: string,
    @Param('dataType') dataType: string,
    @Param('id') id: string,
  ) {
    return this.adminService.deleteTenantData(tenantId, dataType, id);
  }

  // Tenant'a yeni kullanıcı ekle
  @Post('tenants/:tenantId/users')
  @HttpCode(HttpStatus.CREATED)
  async createTenantUser(
    @Param('tenantId') tenantId: string,
    @Body() body: { email: string; password: string; firstName: string; lastName: string },
  ) {
    return this.adminService.createTenantUser(tenantId, body);
  }
}
