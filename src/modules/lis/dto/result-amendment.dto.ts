import { IsOptional, IsString } from 'class-validator';

export class AmendResultDto {
  @IsString()
  reason!: string;

  @IsString()
  @IsOptional()
  correctedValue?: string;

  @IsString()
  correctedById!: string;
}