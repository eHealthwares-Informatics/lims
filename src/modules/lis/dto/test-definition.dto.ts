import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { TestResultType } from '../entities/test-definition.entity';

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
  methodId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  testSectionId?: string;

  @ApiProperty({ enum: TestResultType, default: TestResultType.NUMERIC })
  @IsEnum(TestResultType)
  resultType!: TestResultType;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  validationRules?: Record<string, unknown>;

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
