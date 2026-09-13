import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService, PermissionsGuard],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
