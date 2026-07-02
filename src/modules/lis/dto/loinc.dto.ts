import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateLoincDto {
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
  system?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  component?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  property?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  scale?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
