import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  controllers: [VehiclesController],
  providers: [VehiclesService, PermissionsGuard],
  exports: [VehiclesService],
})
export class VehiclesModule {}
