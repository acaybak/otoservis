import {
  Controller, Get, Post, Body, Query, UseGuards,
} from '@nestjs/common';
import { SyncService } from './sync.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { JwtPayload } from '@otoservis/types';

@Controller('sync')
@UseGuards(PermissionsGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('register-device')
  async registerDevice(@CurrentUser() user: JwtPayload, @Body() body: { name: string; deviceKey?: string }) {
    return this.syncService.registerDevice(user.tenantId, body);
  }

  @Post('push')
  async pushOperations(
    @CurrentUser() user: JwtPayload,
    @Body() body: { deviceKey: string; operations: Array<{ entityId: string; entityType: string; operationType: 'CREATE' | 'UPDATE' | 'DELETE'; payload?: unknown }> },
  ) {
    return this.syncService.pushOperations(body.deviceKey, body.operations);
  }

  /**
   * Delta pull: returns every entity (customer/vehicle/appointment/product/serviceOrder)
   * changed since `since`. Offline clients upsert these into their local store.
   */
  @Get('pull')
  async pullOperations(
    @CurrentUser() user: JwtPayload,
    @Query('since') since?: string,
  ) {
    return this.syncService.pullChanges(user.tenantId, since);
  }

  @Get('conflicts')
  async getConflicts(@CurrentUser() user: JwtPayload) {
    return this.syncService.getConflicts(user.tenantId);
  }

  @Post('resolve-conflict')
  async resolveConflict(
    @CurrentUser() user: JwtPayload,
    @Body() body: { conflictId: string; resolvedValue: unknown },
  ) {
    return this.syncService.resolveConflict(body.conflictId, user.tenantId, body.resolvedValue, user.sub);
  }
}
