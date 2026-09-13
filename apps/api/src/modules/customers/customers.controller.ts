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
import { CustomersService } from './customers.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerSearchSchema,
} from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('customers')
@UseGuards(PermissionsGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Permissions('customer.view')
  @Get()
  async findAll(@CurrentUser() user: JwtPayload, @Query() query: unknown) {
    const params = customerSearchSchema.parse(query);
    const skip = (params.page - 1) * params.limit;
    return this.customersService.findAll(
      user.tenantId,
      { skip, take: params.limit },
      { q: params.q, phone: params.phone },
    );
  }

  @Permissions('customer.view')
  @Get(':id')
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.customersService.findOne(user.tenantId, id);
  }

  @Permissions('customer.manage')
  @Post()
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: unknown,
  ) {
    const data = createCustomerSchema.parse(body);
    return this.customersService.create(user.tenantId, data, user.sub);
  }

  @Permissions('customer.manage')
  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = updateCustomerSchema.parse(body);
    return this.customersService.update(user.tenantId, id, data, user.sub);
  }

  @Permissions('customer.manage')
  @Delete(':id')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.customersService.remove(user.tenantId, id, user.sub);
  }
}
