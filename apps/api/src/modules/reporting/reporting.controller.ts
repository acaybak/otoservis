import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { dashboardQuerySchema, reportQuerySchema } from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('reporting')
@UseGuards(PermissionsGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Permissions('reporting.view')
  @Get('dashboard')
  async getDashboard(@CurrentUser() user: JwtPayload, @Query() query: unknown) {
    const params = dashboardQuerySchema.parse(query);
    return this.reportingService.getDashboard(user.tenantId, params.dateFrom, params.dateTo);
  }

  @Permissions('reporting.view')
  @Get('sales')
  async getSalesReport(@CurrentUser() user: JwtPayload, @Query() query: unknown) {
    const params = reportQuerySchema.parse(query);
    return this.reportingService.getSalesReport(
      user.tenantId, params.dateFrom, params.dateTo, params.groupBy,
    );
  }
}
