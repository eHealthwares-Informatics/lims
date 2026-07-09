import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateQcAlertDto {
  @ApiProperty()
  @IsString()
  qcResultId!: string;

  @ApiProperty()
  @IsString()
  rule!: string;

  @ApiProperty()
  @IsString()
  severity!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class AcknowledgeAlertDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  acknowledgedBy?: string;
}
