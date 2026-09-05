import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { QaChecklistCategory } from '../entities/qa-checklist-item.entity';

export class CreateQaChecklistItemDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['ORDER_ENTRY', 'SPECIMEN', 'TEST', 'RESULT_ENTRY', 'VALIDATION'] })
  @IsEnum(['ORDER_ENTRY', 'SPECIMEN', 'TEST', 'RESULT_ENTRY', 'VALIDATION'])
  @IsOptional()
  category?: QaChecklistCategory;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
