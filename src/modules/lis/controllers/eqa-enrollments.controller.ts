import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { toCsv } from '../../../shared/utils/csv';
import { EqaEnrollmentsService } from '../services/eqa-enrollments.service';
import { CreateEqaEnrollmentDto, SubmitResultsDto } from '../dto/eqa-enrollment.dto';

@ApiTags('lis')
@Controller('lis/eqa-enrollments')
export class EqaEnrollmentsController {
  constructor(private readonly service: EqaEnrollmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List EQA enrollments with pagination' })
  async list(@Query() query: ListQueryDto, @Query() rawQuery: Record<string, string>) {
    const result = await this.service.list({ ...rawQuery, ...query } as any);
    return { data: result.data, meta: { page: query.page, limit: query.limit, total: result.total } };
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async export(@Query() query: ListQueryDto & Record<string, string>) {
    return toCsv((await this.service.list(query)).data as any);
  }

  @Get('by-program/:programId')
  @ApiOperation({ summary: 'List enrollments for a program' })
  async byProgram(@Param('programId') programId: string) {
    const data = await this.service.findByProgram(programId);
    return { data };
  }

  @Get('by-status/:status')
  @ApiOperation({ summary: 'List enrollments by status' })
  async byStatus(@Param('status') status: string) {
    const data = await this.service.findByStatus(status);
    return { data };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEqaEnrollmentDto) {
    return this.service.create(dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Mark enrollment as results submitted' })
  async submit(@Param('id') id: string) {
    return this.service.submitResults(id);
  }

  @Post(':id/evaluate')
  @ApiOperation({ summary: 'Mark enrollment as evaluated' })
  async evaluate(@Param('id') id: string) {
    return this.service.markEvaluated(id);
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