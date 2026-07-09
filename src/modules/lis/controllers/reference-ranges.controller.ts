import { Body, Controller, Delete, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { toCsv } from '../../../shared/utils/csv';
import { ReferenceRangesService } from '../services/reference-ranges.service';
import { CreateReferenceRangeDto } from '../dto/reference-range.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';
import { tenantFromUser } from '../../../common/tenant-context';

@ApiTags('lis')
@Controller('lis/reference-ranges')
export class ReferenceRangesController {
  constructor(private readonly service: ReferenceRangesService) {}

  @Get()
  @ApiOperation({ summary: 'List reference ranges with pagination' })
  async list(@Query() query: ListQueryDto, @Query() rawQuery: Record<string, string>, @CurrentUser() user: RequestUser) {
    const result = await this.service.list({ ...rawQuery, ...query } as any, tenantFromUser(user));
    return { data: result.data, meta: { page: query.page, limit: query.limit, total: result.total } };
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  async export(@Query() query: ListQueryDto & Record<string, string>, @CurrentUser() user: RequestUser) {
    return toCsv((await this.service.list(query, tenantFromUser(user))).data as any);
  }

  @Get('coverage/:testId')
  validateCoverage(@Param('testId') testId: string, @CurrentUser() user: RequestUser) {
    return this.service.validateCoverage(testId, tenantFromUser(user));
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.findOne(id, tenantFromUser(user));
  }

  @Post()
  create(@Body() dto: CreateReferenceRangeDto, @CurrentUser() user: RequestUser) {
    return this.service.create(dto, tenantFromUser(user));
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
