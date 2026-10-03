import { Module } from '@nestjs/common';
import { LicensesController } from './licenses.controller';
import { LicensesService } from './licenses.service';
import { AdminEmailGuard } from '../../common/guards/admin-email.guard';

@Module({
  controllers: [LicensesController],
  providers: [LicensesService, AdminEmailGuard],
  exports: [LicensesService],
})
export class LicensesModule {}
