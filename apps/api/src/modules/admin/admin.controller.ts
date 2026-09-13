import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
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

  private checkAdmin(request: any) {
    const adminEmails = (this.configService.get<string>('ADMIN_EMAILS') || '').split(',').map(e => e.trim().toLowerCase());
    const userEmail = request.user?.email?.toLowerCase();
    if (!userEmail || !adminEmails.includes(userEmail)) {
      throw new ForbiddenException('Bu işlem için süper admin yetkisi gerekli.');
    }
  }

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
    const detail = await this.adminService.getTenantDetail(id);
    if (!detail) {
      throw new ForbiddenException('Tenant bulunamadı.');
    }
    return detail;
  }

  @Patch('tenants/:id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.adminService.updateTenantStatus(id, body.status);
  }
}
