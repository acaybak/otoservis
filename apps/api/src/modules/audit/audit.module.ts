import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from '../../common/services/audit.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  controllers: [AuditController],
  providers: [PermissionsGuard],
})
export class AuditModule_ {}
