import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class InteropPatientDto {
  @IsString()
  patientId!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class InteropItemDto {
  @IsString()
  loincCode!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateInteropOrderDto {
  @ValidateNested()
  @Type(() => InteropPatientDto)
  patient!: InteropPatientDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InteropItemDto)
  items!: InteropItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
