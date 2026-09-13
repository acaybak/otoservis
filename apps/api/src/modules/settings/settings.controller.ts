import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { updateSettingsSchema } from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('settings')
@UseGuards(PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.settingsService.findAll(user.tenantId);
  }

  @Get(':key')
  async findOne(@CurrentUser() user: JwtPayload, @Param('key') key: string) {
    return this.settingsService.findOne(user.tenantId, key);
  }

  @Permissions('settings.manage')
  @Put(':key')
  async upsert(
    @CurrentUser() user: JwtPayload,
    @Param('key') key: string,
    @Body('value') value: unknown,
  ) {
    return this.settingsService.upsert(user.tenantId, key, value);
  }

  @Permissions('settings.manage')
  @Post('bulk')
  async bulkUpsert(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = updateSettingsSchema.parse(body);
    return this.settingsService.bulkUpsert(user.tenantId, data.settings);
  }

  @Permissions('settings.manage')
  @Delete(':key')
  async remove(@CurrentUser() user: JwtPayload, @Param('key') key: string) {
    return this.settingsService.remove(user.tenantId, key);
  }

  @Get('roles')
  async findRoles(@CurrentUser() user: JwtPayload) {
    return this.settingsService.findRoles(user.tenantId);
  }

  @Get('permissions')
  async findPermissions() {
    return this.settingsService.findPermissions();
  }
}
