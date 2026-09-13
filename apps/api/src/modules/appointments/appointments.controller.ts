import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  createAppointmentSchema, updateAppointmentSchema,
  changeAppointmentStatusSchema, appointmentSearchSchema,
} from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('appointments')
@UseGuards(PermissionsGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Permissions('appointment.view')
  @Get()
  async findAll(@CurrentUser() user: JwtPayload, @Query() query: unknown) {
    const params = appointmentSearchSchema.parse(query);
    const skip = (params.page - 1) * params.limit;
    return this.appointmentsService.findAll(user.tenantId, { skip, take: params.limit }, {
      date: params.date, dateFrom: params.dateFrom, dateTo: params.dateTo,
      technicianId: params.technicianId, status: params.status,
    });
  }

  @Permissions('appointment.view')
  @Get(':id')
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.appointmentsService.findOne(user.tenantId, id);
  }

  @Permissions('appointment.manage')
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createAppointmentSchema.parse(body);
    return this.appointmentsService.create(user.tenantId, data, user.sub);
  }

  @Permissions('appointment.manage')
  @Patch(':id')
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const data = updateAppointmentSchema.parse(body);
    return this.appointmentsService.update(user.tenantId, id, data);
  }

  @Permissions('appointment.manage')
  @Patch(':id/status')
  async changeStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: unknown) {
    const data = changeAppointmentStatusSchema.parse(body);
    return this.appointmentsService.changeStatus(user.tenantId, id, data.status, user.sub, data.note);
  }

  @Permissions('appointment.manage')
  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.appointmentsService.remove(user.tenantId, id);
  }
}
