import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateSignatureDto {
  @ApiProperty()
  @IsString()
  resultId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userName?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  @IsOptional()
  isSupervisor?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  signatureData?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
