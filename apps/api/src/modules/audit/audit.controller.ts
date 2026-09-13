import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditService } from '../../common/services/audit.service';
import { paginationSchema } from '@otoservis/validation';
import type { JwtPayload } from '@otoservis/types';

@Controller('audit-logs')
@UseGuards(PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Permissions('audit.view')
  @Get()
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: unknown,
  ) {
    const params = paginationSchema.parse(query);
    const skip = (params.page - 1) * params.limit;
    const q = query as Record<string, string | undefined>;
    return this.auditService.findByTenant(
      user.tenantId,
      { skip, take: params.limit },
      { entity: q.entity, userId: q.userId, action: q.action },
    );
  }
}
