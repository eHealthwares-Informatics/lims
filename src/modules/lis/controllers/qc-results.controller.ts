import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { toCsv } from '../../../shared/utils/csv';
import { QcResultsService } from '../services/qc-results.service';
import { CreateQcResultDto } from '../dto/qc-result.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';
import { tenantFromUser } from '../../../common/tenant-context';

@ApiTags('lis')
@Controller('lis/qc-results')
export class QcResultsController {
  constructor(private readonly service: QcResultsService) {}

  @Get()
  @ApiOperation({ summary: 'List QC results with pagination' })
  async list(@Query() query: ListQueryDto, @Query() rawQuery: Record<string, string>, @CurrentUser() user: RequestUser) {
    const result = await this.service.list({ ...rawQuery, ...query } as any, tenantFromUser(user));
    return { data: result.data, meta: { page: query.page, limit: query.limit, total: result.total } };
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async export(@Query() query: ListQueryDto & Record<string, string>, @CurrentUser() user: RequestUser) {
    return toCsv((await this.service.list(query, tenantFromUser(user))).data as any);
  }

  @Get('by-lot/:qcLotId')
  @ApiOperation({ summary: 'List QC results for a lot' })
  async byLot(@Param('qcLotId') qcLotId: string, @CurrentUser() user: RequestUser) {
    const data = await this.service.findByLot(qcLotId, tenantFromUser(user));
    return { data };
  }

  @Get('out-of-control')
  @ApiOperation({ summary: 'List out-of-control QC results' })
  async outOfControl(@CurrentUser() user: RequestUser) {
    const data = await this.service.findOutOfControl(tenantFromUser(user));
    return { data };
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.findOne(id, tenantFromUser(user));
  }

  @Post()
  create(@Body() dto: CreateQcResultDto, @CurrentUser() user: RequestUser) {
    return this.service.create(dto, tenantFromUser(user));
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: Record<string, unknown>, @CurrentUser() user: RequestUser) {
    return this.service.update(id, dto, tenantFromUser(user));
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() dto: Record<string, unknown>, @CurrentUser() user: RequestUser) {
    return this.service.replace(id, dto, tenantFromUser(user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.service.archive(id, tenantFromUser(user));
    return { ok: true };
  }
}
