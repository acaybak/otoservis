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
import { ServiceOrdersService } from './service-orders.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  createServiceOrderSchema,
  updateServiceOrderSchema,
  changeStatusSchema,
  addPartSchema,
  addLaborSchema,
  addNoteSchema,
  serviceOrderSearchSchema,
} from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('service-orders')
@UseGuards(PermissionsGuard)
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Permissions('service_order.view')
  @Get()
  async findAll(@CurrentUser() user: JwtPayload, @Query() query: unknown) {
    const params = serviceOrderSearchSchema.parse(query);
    const skip = (params.page - 1) * params.limit;
    return this.serviceOrdersService.findAll(user.tenantId, { skip, take: params.limit }, {
      q: params.q, status: params.status, customerId: params.customerId,
      vehicleId: params.vehicleId, assignedToId: params.assignedToId,
      dateFrom: params.dateFrom, dateTo: params.dateTo,
    });
  }

  @Permissions('service_order.view')
  @Get(':id')
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.serviceOrdersService.findOne(user.tenantId, id);
  }

  @Permissions('service_order.manage')
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createServiceOrderSchema.parse(body);
    return this.serviceOrdersService.create(user.tenantId, data, user.sub);
  }

  @Permissions('service_order.manage')
  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = updateServiceOrderSchema.parse(body);
    return this.serviceOrdersService.update(user.tenantId, id, data, user.sub);
  }

  @Permissions('service_order.manage')
  @Patch(':id/status')
  async changeStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = changeStatusSchema.parse(body);
    return this.serviceOrdersService.changeStatus(user.tenantId, id, data.status, user.sub, data.note);
  }

  @Permissions('service_order.manage')
  @Post(':id/parts')
  async addPart(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = addPartSchema.parse(body);
    return this.serviceOrdersService.addPart(user.tenantId, id, data, user.sub);
  }

  @Permissions('service_order.manage')
  @Post(':id/labor')
  async addLabor(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = addLaborSchema.parse(body);
    return this.serviceOrdersService.addLabor(user.tenantId, id, data);
  }

  @Permissions('service_order.manage')
  @Post(':id/notes')
  async addNote(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = addNoteSchema.parse(body);
    return this.serviceOrdersService.addNote(user.tenantId, id, data.content, user.sub);
  }

  @Permissions('service_order.manage')
  @Delete(':id/parts/:partId')
  async removePart(
    @CurrentUser() user: JwtPayload,
    @Param('partId') partId: string,
  ) {
    return this.serviceOrdersService.removePart(partId, user.tenantId);
  }

  @Permissions('service_order.manage')
  @Delete(':id/labor/:laborId')
  async removeLabor(
    @CurrentUser() user: JwtPayload,
    @Param('laborId') laborId: string,
  ) {
    return this.serviceOrdersService.removeLabor(laborId, user.tenantId);
  }
}
