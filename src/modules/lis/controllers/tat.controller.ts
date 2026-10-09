import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TatService } from '../services/tat.service';
import { ListQueryDto } from '../../../shared/dto/list-query.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';
import { tenantFromUser } from '../../../common/tenant-context';

@ApiTags('lis')
@Controller('lis/tat')
export class TatController {
  constructor(private readonly service: TatService) {}

  @Get('report')
  @ApiOperation({ summary: 'TAT report — actual vs. target turnaround time per result' })
  async report(@Query() query: ListQueryDto, @CurrentUser() user: RequestUser) {
    const result = await this.service.report(
      tenantFromUser(user),
      Number(query.limit) || 200,
    );
    return { data: result.data, meta: result.summary };
  }

  @Get('results/:id')
  @ApiOperation({ summary: 'TAT evaluation for a single result' })
  async resultTat(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.getResultTat(id, tenantFromUser(user));
  }
}
