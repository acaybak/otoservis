import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Public } from '../../common/decorators/public.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { createTenantSchema, updateTenantSchema, tenantSetupSchema, updateTenantProfileSchema } from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('tenants')
@UseGuards(PermissionsGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public()
  @Post('setup')
  @HttpCode(HttpStatus.CREATED)
  async setup(@Body() body: unknown) {
    const data = tenantSetupSchema.parse(body);
    return this.tenantsService.setup(data);
  }

  @Permissions('tenant.manage')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown) {
    const data = createTenantSchema.parse(body);
    return this.tenantsService.create(data);
  }

  @Permissions('tenant.manage')
  @Get()
  async findAll() {
    return this.tenantsService.findAll();
  }

  // Current user's own tenant profile (any authenticated user)
  @Get('me')
  async findMe(@CurrentUser() user: JwtPayload) {
    return this.tenantsService.findMe(user.tenantId);
  }

  // Current user updates own tenant profile (contact info + website)
  @Patch('me')
  async updateMe(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = updateTenantProfileSchema.parse(body);
    return this.tenantsService.updateMe(user.tenantId, data);
  }

  @Permissions('tenant.manage')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Permissions('tenant.manage')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown) {
    const data = updateTenantSchema.parse(body);
    return this.tenantsService.update(id, data);
  }
}
