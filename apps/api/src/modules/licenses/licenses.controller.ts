import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { LicensesService } from './licenses.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('licenses')
export class LicensesController {
  constructor(private readonly licensesService: LicensesService) {}

  // ---- Public endpoints (no auth) ----

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateKey(@Body() body: { key: string }) {
    return this.licensesService.validateKey(body.key);
  }

  @Public()
  @Post('activate')
  @HttpCode(HttpStatus.CREATED)
  async activateKey(
    @Body() body: { key: string; tenantId: string; machineId: string },
  ) {
    return this.licensesService.activateKey(body.key, body.tenantId, body.machineId);
  }

  @Public()
  @Post('check')
  @HttpCode(HttpStatus.OK)
  async checkLicense(@Body() body: { tenantId: string; machineId?: string }) {
    return this.licensesService.checkLicense(body.tenantId, body.machineId);
  }

  // ---- Admin endpoints ----

  @Post('keys')
  @HttpCode(HttpStatus.CREATED)
  async createKeys(
    @Body() body: { count: number; planType?: string; maxUsers?: number; duration?: number; note?: string },
  ) {
    return this.licensesService.createKeys(
      body.count || 1,
      body.planType || 'STANDARD',
      body.maxUsers || 3,
      body.duration || 365,
      body.note,
    );
  }

  @Get('keys')
  async listKeys() {
    return this.licensesService.listKeys();
  }

  @Get()
  async listLicenses() {
    return this.licensesService.listLicenses();
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.licensesService.updateLicenseStatus(id, body.status);
  }
}
