import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { TestDefinitionEntity } from './test-definition.entity';
import { UnitOfMeasurementEntity } from './uom.entity';

export enum ReferenceRangeGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  DEFAULT = 'DEFAULT',
}

export enum OperatorEnum {
  BETWEEN = 'BETWEEN',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  EQUALS = 'EQUALS',
}

@Entity('lis_reference_ranges')
export class ReferenceRangeEntity extends LisBaseEntity {
  @ManyToOne(() => TestDefinitionEntity, (test) => test.referenceRanges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_definition_id' })
  test!: TestDefinitionEntity;

  @Column({ type: 'enum', enum: ReferenceRangeGender, default: ReferenceRangeGender.DEFAULT })
  gender!: ReferenceRangeGender;

  @Column({ name: 'min_age', type: 'int' })
  minAge!: number;

  @Column({ name: 'max_age', type: 'int' })
  maxAge!: number;

  @Column({ name: 'low_value', type: 'decimal', precision: 20, scale: 6 })
  lowValue!: string;

  @Column({ name: 'high_value', type: 'decimal', precision: 20, scale: 6 })
  highValue!: string;

  @ManyToOne(() => UnitOfMeasurementEntity, { nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit!: UnitOfMeasurementEntity | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'enum', enum: OperatorEnum, default: OperatorEnum.BETWEEN })
  operator!: OperatorEnum;

  @Column({ name: 'critical_low', type: 'decimal', precision: 20, scale: 6, nullable: true })
  criticalLow!: string | null;

  @Column({ name: 'critical_high', type: 'decimal', precision: 20, scale: 6, nullable: true })
  criticalHigh!: string | null;
}
