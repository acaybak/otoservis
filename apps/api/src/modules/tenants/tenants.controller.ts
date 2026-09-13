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
import { createTenantSchema, updateTenantSchema, tenantSetupSchema } from '@otoservis/validation';

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
