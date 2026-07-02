import { IsOptional, IsString } from 'class-validator';

export class CreateResultDto {
  @IsString()
  orderItemId!: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  referenceRangeId?: string;

  @IsOptional()
  @IsString()
  enteredById?: string;

  @IsOptional()
  @IsString()
  enteredDate?: string;

  @IsOptional()
  @IsString()
  validatedById?: string;

  @IsOptional()
  @IsString()
  validatedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
