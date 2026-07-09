import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { toCsv } from '../../../shared/utils/csv';
import { QcAlertsService } from '../services/qc-alerts.service';
import { AcknowledgeAlertDto } from '../dto/qc-alert.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';
import { tenantFromUser } from '../../../common/tenant-context';

@ApiTags('lis')
@Controller('lis/qc-alerts')
export class QcAlertsController {
  constructor(private readonly service: QcAlertsService) {}

  @Get()
  @ApiOperation({ summary: 'List QC alerts with pagination' })
  async list(@Query() query: ListQueryDto, @Query() rawQuery: Record<string, string>, @CurrentUser() user: RequestUser) {
    const result = await this.service.list({ ...rawQuery, ...query } as any, tenantFromUser(user));
    return { data: result.data, meta: { page: query.page, limit: query.limit, total: result.total } };
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async export(@Query() query: ListQueryDto & Record<string, string>, @CurrentUser() user: RequestUser) {
    return toCsv((await this.service.list(query, tenantFromUser(user))).data as any);
  }

  @Get('active')
  @ApiOperation({ summary: 'List active QC alerts' })
  async active(@CurrentUser() user: RequestUser) {
    const data = await this.service.findActive(tenantFromUser(user));
    return { data };
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.findOne(id, tenantFromUser(user));
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: Record<string, unknown>, @CurrentUser() user: RequestUser) {
    return this.service.update(id, dto, tenantFromUser(user));
  }

  @Post(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge a QC alert' })
  async acknowledge(@Param('id') id: string, @Body() dto: AcknowledgeAlertDto, @CurrentUser() user: RequestUser) {
    return this.service.acknowledge(id, dto.acknowledgedBy, tenantFromUser(user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.service.archive(id, tenantFromUser(user));
    return { ok: true };
  }
}
