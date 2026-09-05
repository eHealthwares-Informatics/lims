import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEqaResultDto {
  @ApiProperty()
  @IsString()
  enrollmentId!: string;

  @ApiProperty()
  @IsString()
  sampleNumber!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  value?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  submittedAt?: string;
}

export class EvaluateEqaResultDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  expectedValue?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  zScore?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  evaluation?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  evaluatedAt?: string;
}