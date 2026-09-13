import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Module({
  controllers: [SyncController],
  providers: [SyncService, PermissionsGuard],
  exports: [SyncService],
})
export class SyncModule {}
