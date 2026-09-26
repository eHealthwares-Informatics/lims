import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  testDefinitionId!: string;

  @IsOptional()
  @IsString()
  sampleId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /** Stable cross-system reference from the EMR request line. */
  @IsOptional()
  @IsString()
  referenceCode?: string;
}

class StepProgressDto {
  @IsOptional()
  @IsBoolean()
  enter?: boolean;

  @IsOptional()
  @IsBoolean()
  collect?: boolean;

  @IsOptional()
  @IsBoolean()
  label?: boolean;

  @IsOptional()
  @IsBoolean()
  qa?: boolean;
}

class OrderSampleDto {
  @IsString()
  barcode!: string;

  @IsOptional()
  @IsString()
  sampleTypeId?: string;

  @IsOptional()
  @IsString()
  collector?: string;

  @IsOptional()
  @IsString()
  collectionDate?: string;

  @IsOptional()
  @IsString()
  receivedDate?: string;

  @IsOptional()
  @IsString()
  collectionMethod?: string;

  @IsOptional()
  @IsString()
  collectionConditions?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  storageLocationId?: string;

  @IsOptional()
  @IsString()
  storageNotes?: string;

  @IsOptional()
  @IsString()
  printStatus?: string;

  @IsOptional()
  @IsString()
  printedAt?: string;
}

class OrderAssignmentDto {
  @IsString()
  testDefinitionId!: string;

  @IsNumber()
  @Min(0)
  sampleIndex!: number;
}

export class CreateOrderDto {
  @IsString()
  patientId!: string;

  /** Human-facing patient identifier (MRN/patient number) from the EMR. */
  @IsOptional()
  @IsString()
  patientNumber?: string;

  /** Stable cross-system reference for the order (EMR request number). */
  @IsOptional()
  @IsString()
  referenceCode?: string;

  @IsOptional()
  @IsString()
  internalReference?: string;

  @IsOptional()
  @IsString()
  externalReference?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsString()
  patientName!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  patientAge?: number;

  @IsOptional()
  @IsString()
  patientGender?: string;

  @IsOptional()
  @IsString()
  patientDateOfBirth?: string;

  @IsOptional()
  @IsString()
  priorityId?: string;

  @IsOptional()
  @IsString()
  requestedDate?: string;

  @IsOptional()
  @IsString()
  requesterName?: string;

  @IsOptional()
  @IsString()
  requesterPhone?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => StepProgressDto)
  stepProgress?: StepProgressDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderSampleDto)
  samples?: OrderSampleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderAssignmentDto)
  assignments?: OrderAssignmentDto[];

  @IsOptional()
  @IsObject()
  qaChecks?: Record<string, boolean>;
}
