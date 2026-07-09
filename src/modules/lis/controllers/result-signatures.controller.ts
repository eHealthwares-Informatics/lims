import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResultSignaturesService } from '../services/result-signatures.service';
import { CreateSignatureDto } from '../dto/result-signature.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';
import { tenantFromUser } from '../../../common/tenant-context';

@ApiTags('lis')
@Controller('lis/result-signatures')
export class ResultSignaturesController {
  constructor(private readonly service: ResultSignaturesService) {}

  @Post()
  @ApiOperation({ summary: 'Sign a result (technical or supervisor)' })
  async sign(@Body() dto: CreateSignatureDto, @CurrentUser() user: RequestUser) {
    return this.service.sign(dto, tenantFromUser(user));
  }

  @Get('by-result/:resultId')
  @ApiOperation({ summary: 'Get signatures for a result' })
  async byResult(@Param('resultId') resultId: string, @CurrentUser() user: RequestUser) {
    const data = await this.service.findByResult(resultId, tenantFromUser(user));
    return { data };
  }

  @Get('status/:resultId')
  @ApiOperation({ summary: 'Get signature status for a result' })
  async status(@Param('resultId') resultId: string, @CurrentUser() user: RequestUser) {
    return this.service.getSignatureStatus(resultId, tenantFromUser(user));
  }
}
