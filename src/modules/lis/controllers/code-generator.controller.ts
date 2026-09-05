import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CodeGeneratorService } from '../services/code-generator.service';
import { GenerateCodeQueryDto } from '../dto/generate-code.dto';

@ApiTags('lis')
@Controller('lis/code-generator')
export class CodeGeneratorController {
  constructor(private readonly codes: CodeGeneratorService) {}

  @Get('generate')
  @ApiOperation({ summary: 'Generate a code for an entity based on scope, prefix or name' })
  generate(@Query() query: GenerateCodeQueryDto) {
    const code = this.codes.generate(query.scope ?? '', query.seed, {
      mode: query.mode,
      prefix: query.prefix,
      maxLength: query.maxLength,
    });
    return { code };
  }
}
