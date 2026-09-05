import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GenerateCodeQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiPropertyOptional({ default: '' })
  @IsString()
  @IsOptional()
  seed = '';

  @ApiPropertyOptional({ enum: ['scope', 'prefix', 'name'], default: 'scope' })
  @IsIn(['scope', 'prefix', 'name'])
  @IsOptional()
  mode: 'scope' | 'prefix' | 'name' = 'scope';

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  prefix?: string;

  @ApiPropertyOptional({ default: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  maxLength = 12;
}
