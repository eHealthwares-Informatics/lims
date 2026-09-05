import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { toCsv } from '../../../shared/utils/csv';
import { EqaProgramsService } from '../services/eqa-programs.service';
import { CreateEqaProgramDto } from '../dto/eqa-program.dto';

@ApiTags('lis')
@Controller('lis/eqa-programs')
export class EqaProgramsController {
  constructor(private readonly service: EqaProgramsService) {}

  @Get()
  @ApiOperation({ summary: 'List EQA programs with pagination' })
  async list(@Query() query: ListQueryDto, @Query() rawQuery: Record<string, string>) {
    const result = await this.service.list({ ...rawQuery, ...query } as any);
    return { data: result.data, meta: { page: query.page, limit: query.limit, total: result.total } };
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async export(@Query() query: ListQueryDto & Record<string, string>) {
    return toCsv((await this.service.list(query)).data as any);
  }

  @Get('active')
  @ApiOperation({ summary: 'List active EQA programs' })
  async active() {
    const data = await this.service.findActive();
    return { data };
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEqaProgramDto) {
    return this.service.create(dto);
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