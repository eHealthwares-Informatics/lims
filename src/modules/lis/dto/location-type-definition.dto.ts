import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional } from 'class-validator';
import { NamedCodeDto } from './named-code.dto';

export class CreateLocationTypeDefinitionDto extends NamedCodeDto {
  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  allowChildren?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  allowedChildTypeIds?: string[];
}
