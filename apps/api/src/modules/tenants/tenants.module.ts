import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, PermissionsGuard],
  exports: [TenantsService],
})
export class TenantsModule {}
