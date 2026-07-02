import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { NamedCodeDto } from './named-code.dto';

export class CreateProgramDto extends NamedCodeDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  testDefinitionIds?: string[];
}
