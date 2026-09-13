import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { createUserSchema, updateUserSchema, assignRoleSchema, paginationSchema } from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Permissions('user.manage')
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: unknown,
  ) {
    const pagination = paginationSchema.parse(query);
    const skip = (pagination.page - 1) * pagination.limit;
    return this.usersService.findAll(user.tenantId, {
      skip,
      take: pagination.limit,
    });
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    if (id !== user.sub && !this.hasUserManagePermission(user)) {
      return this.usersService.findOne(user.tenantId, user.sub);
    }
    return this.usersService.findOne(user.tenantId, id);
  }

  @Permissions('user.manage')
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    const data = createUserSchema.parse(body);
    return this.usersService.create(user.tenantId, data);
  }

  @Permissions('user.manage')
  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = updateUserSchema.parse(body);
    return this.usersService.update(user.tenantId, id, data);
  }

  @Permissions('user.manage')
  @Post(':id/roles')
  async assignRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = assignRoleSchema.parse(body);
    return this.usersService.assignRole(user.tenantId, id, data.roleId);
  }

  @Permissions('user.manage')
  @Delete(':id/roles/:roleId')
  async removeRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    return this.usersService.removeRole(user.tenantId, id, roleId);
  }

  private hasUserManagePermission(user: JwtPayload): boolean {
    return user.roles.includes('SUPER_ADMIN') || user.roles.includes('TENANT_OWNER') || user.roles.includes('MANAGER');
  }
}
