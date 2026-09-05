import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { OperatorEnum, ReferenceRangeGender } from '../entities';

export class CreateReferenceRangeDto {
  @ApiProperty()
  @IsString()
  testId!: string;

  @ApiProperty({ enum: ReferenceRangeGender })
  @IsEnum(ReferenceRangeGender)
  gender!: ReferenceRangeGender;

  @ApiProperty()
  @IsString()
  alias!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  minAge!: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  maxAge!: number;

  @ApiProperty()
  @IsNumber()
  lowValue!: number;

  @ApiProperty()
  @IsNumber()
  highValue!: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  unitId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ enum: OperatorEnum, default: OperatorEnum.BETWEEN })
  @IsEnum(OperatorEnum)
  @IsOptional()
  operator!: OperatorEnum;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  criticalLow?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  criticalHigh?: number;
}
