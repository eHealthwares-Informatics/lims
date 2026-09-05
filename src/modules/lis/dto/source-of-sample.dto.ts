import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSourceOfSampleDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  description!: string;

  @ApiPropertyOptional({ default: 'H' })
  @IsString()
  @IsOptional()
  domain?: string;
}
