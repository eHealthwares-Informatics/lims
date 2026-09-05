import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  async list(@Query() query: ListQueryDto, @Query() rawQuery: Record<string, string>) {
    const result = await this.service.list({ ...rawQuery, ...query } as any);
    return { data: result.data, meta: { page: query.page, limit: query.limit, total: result.total } };
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async export(@Query() query: ListQueryDto & Record<string, string>) {
    return toCsv((await this.service.list(query)).data as any);
  }

  @Get('by-enrollment/:enrollmentId')
  @ApiOperation({ summary: 'List results for an enrollment' })
  async byEnrollment(@Param('enrollmentId') enrollmentId: string) {
    const data = await this.service.findByEnrollment(enrollmentId);
    return { data };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEqaResultDto) {
    return this.service.create(dto);
  }

  @Post(':id/evaluate')
  @ApiOperation({ summary: 'Evaluate/score an EQA result' })
  async evaluate(@Param('id') id: string, @Body() dto: EvaluateEqaResultDto) {
    return this.service.evaluate(id, dto);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.service.update(id, dto);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.service.replace(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.archive(id);
    return { ok: true };
  }
}