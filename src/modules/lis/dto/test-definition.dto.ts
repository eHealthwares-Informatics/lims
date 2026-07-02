import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTestDefinitionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  loincId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  methodology?: string;

  @ApiProperty({ default: 'NUMERIC' })
  @IsString()
  resultType!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  sampleTypeIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  programIds?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  uomId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  minValue?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  maxValue?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  criticalMin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  criticalMax?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  turnaroundTimeMinutes?: number;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  testDurationMinutes?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  reportable?: boolean;
}
