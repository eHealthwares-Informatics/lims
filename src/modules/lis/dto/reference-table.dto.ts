import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateReferenceTableDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  keepHistory?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isHl7Encoded?: boolean;
}
