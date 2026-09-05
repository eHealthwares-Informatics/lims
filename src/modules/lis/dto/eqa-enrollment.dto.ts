import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateEqaEnrollmentDto {
  @ApiProperty()
  @IsString()
  programId!: string;

  @ApiProperty()
  @IsString()
  testDefinitionId!: string;

  @ApiProperty()
  @IsString()
  roundLabel!: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  enrolledAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class SubmitResultsDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  submittedAt?: string;
}