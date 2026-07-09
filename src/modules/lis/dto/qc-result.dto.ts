import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateQcResultDto {
  @ApiProperty()
  @IsString()
  qcLotId!: string;

  @ApiProperty()
  @IsString()
  testDefinitionId!: string;

  @ApiProperty()
  @IsNumber()
  value!: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  measuredAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instrument?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  technician?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  inControl?: boolean;
}
