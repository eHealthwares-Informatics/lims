import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';
import { tenantFromUser } from '../../../common/tenant-context';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { toCsv } from '../../../shared/utils/csv';
import { EqaResultsService } from '../services/eqa-results.service';
import { CreateEqaResultDto, EvaluateEqaResultDto } from '../dto/eqa-result.dto';

@ApiTags('lis')
@Controller('lis/eqa-results')
export class EqaResultsController {
  constructor(private readonly service: EqaResultsService) {}

  @Get()
  @ApiOperation({ summary: 'List EQA results with pagination' })
  async list(
    @Query() query: ListQueryDto,
    @Query() rawQuery: Record<string, string>,
    @CurrentUser() user: RequestUser,
  ) {
    const result = await this.service.list(
      { ...rawQuery, ...query } as any,
      tenantFromUser(user),
    );
    return { data: result.data, meta: { page: query.page, limit: query.limit, total: result.total } };
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async export(
    @Query() query: ListQueryDto & Record<string, string>,
    @CurrentUser() user: RequestUser,
  ) {
    return toCsv(
      (await this.service.list(query, tenantFromUser(user))).data as any,
    );
  }

  @Get('by-enrollment/:enrollmentId')
  @ApiOperation({ summary: 'List results for an enrollment' })
  async byEnrollment(@Param('enrollmentId') enrollmentId: string) {
    const data = await this.service.findByEnrollment(enrollmentId);
    return { data };
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.findOne(id, tenantFromUser(user));
  }

  @Post()
  create(@Body() dto: CreateEqaResultDto) {
    // EQA rows are global by default (no organisation stamped).
    return this.service.create(dto);
  }

  @Post(':id/evaluate')
  @ApiOperation({ summary: 'Evaluate/score an EQA result' })
  async evaluate(@Param('id') id: string, @Body() dto: EvaluateEqaResultDto) {
    return this.service.evaluate(id, dto);
  }

  @Patch(':id')
  patch(
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.update(id, dto, tenantFromUser(user));
  }

  @Put(':id')
  replace(
    @Param('id') id: string,
    @Body() dto: Record<string, unknown>,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.replace(id, dto, tenantFromUser(user));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.service.archive(id, tenantFromUser(user));
    return { ok: true };
  }
}
