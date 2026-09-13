import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { createNotificationSchema } from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('notifications')
@UseGuards(PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('userId') userId?: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationsService.findAll(user.tenantId, userId, unreadOnly === 'true');
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.getUnreadCount(user.tenantId, user.sub);
  }

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createNotificationSchema.parse(body);
    return this.notificationsService.create(user.tenantId, data);
  }

  @Patch(':id/read')
  async markAsRead(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, user.tenantId);
  }

  @Post('mark-all-read')
  async markAllAsRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllAsRead(user.tenantId, user.sub);
  }
}
