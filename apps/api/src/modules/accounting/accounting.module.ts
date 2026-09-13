import { Module } from '@nestjs/common';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  controllers: [AccountingController],
  providers: [AccountingService, PermissionsGuard],
  exports: [AccountingService],
})
export class AccountingModule {}
