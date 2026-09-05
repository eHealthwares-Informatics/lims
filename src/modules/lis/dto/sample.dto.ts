import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSampleDto {
  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty()
  @IsString()
  barcode!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sampleTypeId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collector?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collectionDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collectionMethod?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collectionConditions?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ default: 'PENDING' })
  @IsString()
  @IsOptional()
  printStatus?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  printedAt?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  storageLocationId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  storageNotes?: string;
}

export class TransitionOrderStatusDto {
  @ApiProperty()
  @IsString()
  statusId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}

export class TransitionResultStatusDto {
  @ApiProperty()
  @IsString()
  statusId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
