import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminEmailGuard } from '../../common/guards/admin-email.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminEmailGuard],
  exports: [AdminService],
})
export class AdminModule {}
