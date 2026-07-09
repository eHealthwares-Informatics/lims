import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersProxyService } from '../services/users-proxy.service';

@ApiTags('lis')
@Controller('lis/users')
export class UsersProxyController {
  constructor(private readonly proxy: UsersProxyService) {}

  @Get()
  @ApiOperation({ summary: 'List users (proxied from rxsoft-backend)' })
  async list(@Headers('authorization') auth: string, @Query() query: Record<string, string>) {
    return this.proxy.list(auth?.replace('Bearer ', '') ?? '', query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (proxied from rxsoft-backend)' })
  async get(@Headers('authorization') auth: string, @Param('id') id: string) {
    return this.proxy.findOne(auth?.replace('Bearer ', '') ?? '', id);
  }
}
