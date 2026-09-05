import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { tenantFromUser } from '../../../common/tenant-context';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';
import { DashboardService } from '../services/dashboard.service';

@ApiTags('lis-dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lis/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get dashboard metrics for the current organization' })
  async getMetrics(@CurrentUser() user: RequestUser) {
    const tenant = tenantFromUser(user);
    return this.dashboardService.getMetrics(tenant.organizationId, tenant.userId);
  }

  @Get('metrics/:type')
  @ApiOperation({ summary: 'Get drilldown items for a specific metric type' })
  async getMetricItems(
    @Param('type') type: string,
    @Query() query: { offset?: string; limit?: string },
    @CurrentUser() user: RequestUser,
  ) {
    const tenant = tenantFromUser(user);
    return this.dashboardService.getMetricItems(type, tenant.organizationId, tenant.userId, {
      offset: query.offset ? Number(query.offset) : 0,
      limit: query.limit ? Number(query.limit) : 50,
    });
  }
}