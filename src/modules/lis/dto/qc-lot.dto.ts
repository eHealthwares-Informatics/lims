import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class QcLotTestConfigDto {
  @IsString()
  testDefinitionId!: string;

  @IsNumber()
  mean!: number;

  @IsNumber()
  sd!: number;

  @IsOptional()
  @IsString()
  testName?: string;
}

export class CreateQcLotDto {
  @ApiProperty()
  @IsString()
  controlName!: string;

  @ApiProperty()
  @IsString()
  lotNumber!: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  @IsObject({ each: true })
  testConfig?: QcLotTestConfigDto[];
}
