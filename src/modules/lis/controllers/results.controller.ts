import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { toCsv } from '../../../shared/utils/csv';
import { ResultsService } from '../services/results.service';
import { StatusHistoryService } from '../services/status-history.service';
import { CreateResultDto } from '../dto/result.dto';
import { TransitionResultStatusDto } from '../dto/sample.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';
import { tenantFromUser } from '../../../common/tenant-context';

@ApiTags('lis')
@Controller('lis/results')
export class ResultsController {
  constructor(
    private readonly service: ResultsService,
    private readonly statusHistory: StatusHistoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List results with pagination' })
  async list(@Query() query: ListQueryDto, @Query() rawQuery: Record<string, string>, @CurrentUser() user: RequestUser) {
    const result = await this.service.list({ ...rawQuery, ...query } as any, tenantFromUser(user));
    return { data: result.data, meta: { page: query.page, limit: query.limit, total: result.total } };
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async export(@Query() query: ListQueryDto & Record<string, string>, @CurrentUser() user: RequestUser) {
    return toCsv((await this.service.list(query, tenantFromUser(user))).data as any);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.findOne(id, tenantFromUser(user));
  }

  @Get(':id/status-history')
  @ApiOperation({ summary: 'Get result status transition history' })
  async getStatusHistory(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    const data = await this.statusHistory.findByEntity('Result', id, tenantFromUser(user));
    return { data };
  }

  @Post()
  create(@Body() dto: CreateResultDto, @CurrentUser() user: RequestUser) {
    return this.service.create(dto, tenantFromUser(user));
  }

  @Post(':id/transition')
  @ApiOperation({ summary: 'Transition result status' })
  async transition(@Param('id') id: string, @Body() dto: TransitionResultStatusDto, @CurrentUser() user: RequestUser) {
    return this.service.transitionStatus(id, dto.statusId, undefined, dto.reason, tenantFromUser(user));
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: Record<string, unknown>, @CurrentUser() user: RequestUser) {
    return this.service.update(id, dto, tenantFromUser(user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.service.archive(id, tenantFromUser(user));
    return { ok: true };
  }
}
