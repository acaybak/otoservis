import { Module, forwardRef } from '@nestjs/common';
import {
  MaintenanceTypesController,
  VehicleMaintenancesController,
  MaintenanceRecordsController,
  VehicleHistoryController,
  ServiceOrderMaintenanceController,
} from './vehicle-maintenance.controller';
import { VehicleMaintenanceService } from './vehicle-maintenance.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  controllers: [
    MaintenanceTypesController,
    VehicleMaintenancesController,
    MaintenanceRecordsController,
    VehicleHistoryController,
    ServiceOrderMaintenanceController,
  ],
  providers: [VehicleMaintenanceService, PermissionsGuard],
  exports: [forwardRef(() => VehicleMaintenanceService)],
})
export class VehicleMaintenanceModule {}
