import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';
import { NamedCodeDto } from './named-code.dto';

export class CreatePanelDto extends NamedCodeDto {
  @ApiPropertyOptional({ type: 'array' })
  @IsArray()
  @IsOptional()
  items?: Array<{ testId: string; sortOrder?: number }>;
}
