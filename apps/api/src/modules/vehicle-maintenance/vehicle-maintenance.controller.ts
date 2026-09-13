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
import { VehicleMaintenanceService } from './vehicle-maintenance.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  createMaintenanceTypeSchema,
  updateMaintenanceTypeSchema,
  createVehicleMaintenanceSchema,
  updateVehicleMaintenanceSchema,
  createMaintenanceRecordSchema,
  updateMaintenanceRecordSchema,
  addMaintenanceItemSchema,
  maintenanceRecordSearchSchema,
  vehicleMaintenanceSearchSchema,
} from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

// =============================================================================
// MAINTENANCE TYPES (Bakım Tipleri)
// =============================================================================

@Controller('maintenance-types')
@UseGuards(PermissionsGuard)
export class MaintenanceTypesController {
  constructor(private readonly service: VehicleMaintenanceService) {}

  @Permissions('maintenance.view')
  @Get()
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAllTypes(user.tenantId);
  }

  @Permissions('maintenance.view')
  @Get(':id')
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.findOneType(user.tenantId, id);
  }

  @Permissions('maintenance.manage')
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createMaintenanceTypeSchema.parse(body);
    return this.service.createType(user.tenantId, data, user.sub);
  }

  @Permissions('maintenance.manage')
  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = updateMaintenanceTypeSchema.parse(body);
    return this.service.updateType(user.tenantId, id, data, user.sub);
  }

  @Permissions('maintenance.manage')
  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deleteType(user.tenantId, id, user.sub);
  }
}

// =============================================================================
// VEHICLE MAINTENANCE PLANS (Araç Bakım Planları)
// =============================================================================

@Controller('vehicle-maintenances')
@UseGuards(PermissionsGuard)
export class VehicleMaintenancesController {
  constructor(private readonly service: VehicleMaintenanceService) {}

  @Permissions('maintenance.view')
  @Get()
  async findAll(@CurrentUser() user: JwtPayload, @Query() query: unknown) {
    const params = vehicleMaintenanceSearchSchema.parse(query);
    const skip = (params.page - 1) * params.limit;
    return this.service.findAllVehicleMaintenances(
      user.tenantId,
      { skip, take: params.limit },
      {
        vehicleId: params.vehicleId,
        maintenanceTypeId: params.maintenanceTypeId,
      },
    );
  }

  @Permissions('maintenance.view')
  @Get(':id')
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.findOneVehicleMaintenance(user.tenantId, id);
  }

  @Permissions('maintenance.manage')
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createVehicleMaintenanceSchema.parse(body);
    return this.service.createVehicleMaintenance(user.tenantId, data, user.sub);
  }

  @Permissions('maintenance.manage')
  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = updateVehicleMaintenanceSchema.parse(body);
    return this.service.updateVehicleMaintenance(user.tenantId, id, data, user.sub);
  }

  @Permissions('maintenance.manage')
  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deleteVehicleMaintenance(user.tenantId, id, user.sub);
  }
}

// =============================================================================
// MAINTENANCE RECORDS (Bakım Kayıtları)
// =============================================================================

@Controller('maintenance-records')
@UseGuards(PermissionsGuard)
export class MaintenanceRecordsController {
  constructor(private readonly service: VehicleMaintenanceService) {}

  @Permissions('maintenance.view')
  @Get()
  async findAll(@CurrentUser() user: JwtPayload, @Query() query: unknown) {
    const params = maintenanceRecordSearchSchema.parse(query);
    const skip = (params.page - 1) * params.limit;
    return this.service.findAllRecords(
      user.tenantId,
      { skip, take: params.limit },
      {
        vehicleId: params.vehicleId,
        maintenanceTypeId: params.maintenanceTypeId,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
      },
    );
  }

  @Permissions('maintenance.view')
  @Get(':id')
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.findOneRecord(user.tenantId, id);
  }

  @Permissions('maintenance.manage')
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createMaintenanceRecordSchema.parse(body);
    return this.service.createRecord(user.tenantId, data, user.sub);
  }

  @Permissions('maintenance.manage')
  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = updateMaintenanceRecordSchema.parse(body);
    return this.service.updateRecord(user.tenantId, id, data, user.sub);
  }

  @Permissions('maintenance.manage')
  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.deleteRecord(user.tenantId, id, user.sub);
  }

  @Permissions('maintenance.manage')
  @Post(':id/items')
  async addItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = addMaintenanceItemSchema.parse(body);
    return this.service.addItem(user.tenantId, id, data, user.sub);
  }

  @Permissions('maintenance.manage')
  @Delete(':recordId/items/:itemId')
  async removeItem(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') itemId: string,
  ) {
    return this.service.removeItem(user.tenantId, itemId, user.sub);
  }
}

// =============================================================================
// VEHICLE MAINTENANCE HISTORY (Araç Bakım Geçmişi)
// =============================================================================

@Controller('vehicles/:vehicleId/maintenance-history')
@UseGuards(PermissionsGuard)
export class VehicleHistoryController {
  constructor(private readonly service: VehicleMaintenanceService) {}

  @Permissions('maintenance.view')
  @Get()
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.service.getVehicleHistory(user.tenantId, vehicleId);
  }
}

// =============================================================================
// AUTO-CREATE from Service Order (İş emrinden otomatik bakım kaydı)
// =============================================================================

@Controller('service-orders/:serviceOrderId/maintenance-record')
@UseGuards(PermissionsGuard)
export class ServiceOrderMaintenanceController {
  constructor(private readonly service: VehicleMaintenanceService) {}

  @Permissions('maintenance.manage')
  @Post()
  async createFromServiceOrder(
    @CurrentUser() user: JwtPayload,
    @Param('serviceOrderId') serviceOrderId: string,
  ) {
    return this.service.createRecordFromServiceOrder(
      user.tenantId,
      serviceOrderId,
      user.sub,
    );
  }
}
