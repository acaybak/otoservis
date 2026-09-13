import { Module, forwardRef } from '@nestjs/common';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { VehicleMaintenanceModule } from '../vehicle-maintenance/vehicle-maintenance.module';

@Module({
  imports: [forwardRef(() => VehicleMaintenanceModule)],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService, PermissionsGuard],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
