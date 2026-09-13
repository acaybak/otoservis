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
import { VehiclesService } from './vehicles.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleSearchSchema,
} from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('vehicles')
@UseGuards(PermissionsGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Permissions('vehicle.view')
  @Get()
  async findAll(@CurrentUser() user: JwtPayload, @Query() query: unknown) {
    const params = vehicleSearchSchema.parse(query);
    const skip = (params.page - 1) * params.limit;
    return this.vehiclesService.findAll(
      user.tenantId,
      { skip, take: params.limit },
      { q: params.q, plate: params.plate, brand: params.brand },
    );
  }

  @Permissions('vehicle.view')
  @Get('plate/:plate')
  async findByPlate(@CurrentUser() user: JwtPayload, @Param('plate') plate: string) {
    return this.vehiclesService.findByPlate(user.tenantId, plate);
  }

  @Permissions('vehicle.view')
  @Get(':id')
  async findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.vehiclesService.findOne(user.tenantId, id);
  }

  @Permissions('vehicle.manage')
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const data = createVehicleSchema.parse(body);
    return this.vehiclesService.create(user.tenantId, data, user.sub);
  }

  @Permissions('vehicle.manage')
  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const data = updateVehicleSchema.parse(body);
    return this.vehiclesService.update(user.tenantId, id, data, user.sub);
  }

  @Permissions('vehicle.manage')
  @Post(':id/owners/:customerId')
  async addOwner(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('customerId') customerId: string,
  ) {
    return this.vehiclesService.addOwner(user.tenantId, id, customerId);
  }

  @Permissions('vehicle.manage')
  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.vehiclesService.remove(user.tenantId, id, user.sub);
  }
}
