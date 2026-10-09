import { IsOptional, IsString } from 'class-validator';

export class QaHoldDto {
  @IsString()
  reason!: string;

  @IsString()
  reviewerId!: string;
}

export class QaReleaseDto {
  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  reviewerId!: string;
}