import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateObservationHistoryTypeDto {
  @ApiProperty()
  @IsString()
  typeName!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
