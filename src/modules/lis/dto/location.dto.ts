import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateLocationDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Identity service site (location) id this lab location belongs to; defaults to the caller\u2019s location' })
  @IsString()
  @IsOptional()
  locationId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty()
  @IsString()
  typeId!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  storageAssignment?: boolean;

  @ApiPropertyOptional({ type: 'array' })
  @IsArray()
  @IsOptional()
  attributeValues?: Array<{ attributeDefinitionId: string; value?: string | null }>;
}
