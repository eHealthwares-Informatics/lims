import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSampleTypeDto {
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
  key?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(3)
  accessionCode!: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Preferred volume' })
  @IsNumber()
  @IsOptional()
  defaultQuantity?: number;

  @ApiPropertyOptional({ description: 'Minimum volume' })
  @IsNumber()
  @IsOptional()
  minimumQuantity?: number;

  @ApiPropertyOptional({ description: 'Unit (mL, g, etc.)' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: 'Required container' })
  @IsString()
  @IsOptional()
  containerType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collectionInstructions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  storageRequirements?: string;
}
