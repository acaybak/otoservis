import { Module } from '@nestjs/common';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  controllers: [ReportingController],
  providers: [ReportingService, PermissionsGuard],
})
export class ReportingModule {}
