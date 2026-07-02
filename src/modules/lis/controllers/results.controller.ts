import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { toCsv } from '../../../shared/utils/csv';
import { ResultsService } from '../services/results.service';
import { CreateResultDto } from '../dto/result.dto';

@ApiTags('lis')
@Controller('lis/results')
export class ResultsController {
  constructor(private readonly service: ResultsService) {}

  @Get()
  @ApiOperation({ summary: 'List results with pagination' })
  async list(@Query() query: ListQueryDto, @Query() rawQuery: Record<string, string>) {
    const result = await this.service.list({ ...rawQuery, ...query } as any);
    return { data: result.data, meta: { page: query.page, limit: query.limit, total: result.total } };
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async export(@Query() query: ListQueryDto & Record<string, string>) {
    return toCsv((await this.service.list(query)).data as any);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateResultDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  patch(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.service.archive(id);
    return { ok: true };
  }
}
