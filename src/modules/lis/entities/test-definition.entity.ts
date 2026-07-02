import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { LoincEntity } from './loinc.entity';
import { ProgramEntity } from './program.entity';
import { ReferenceRangeEntity } from './reference-range.entity';
import { SampleTypeEntity } from './sample-type.entity';
import { TestCategoryEntity } from './test-category.entity';
import { UnitOfMeasurementEntity } from './uom.entity';

@Entity('lis_test_definitions')
export class TestDefinitionEntity extends LisBaseEntity {
  @Column({ type: 'text', unique: true })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToMany(() => ProgramEntity, (program) => program.testDefinitions)
  programs!: ProgramEntity[];

  @ManyToOne(() => LoincEntity, { nullable: true })
  @JoinColumn({ name: 'loinc_id' })
  loinc!: LoincEntity | null;

  @ManyToOne(() => TestCategoryEntity, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category!: TestCategoryEntity | null;

  @Column({ type: 'text', nullable: true })
  methodology!: string | null;

  @Column({ name: 'result_type', type: 'text' })
  resultType!: string;

  @ManyToMany(() => SampleTypeEntity)
  @JoinTable({
    name: 'lis_test_definition_sample_types',
    joinColumn: { name: 'test_definition_id' },
    inverseJoinColumn: { name: 'sample_type_id' },
  })
  sampleTypes!: SampleTypeEntity[];

  @ManyToOne(() => UnitOfMeasurementEntity, { nullable: true })
  @JoinColumn({ name: 'uom_id' })
  uom!: UnitOfMeasurementEntity | null;

  @Column({ name: 'min_value', type: 'text', nullable: true })
  minValue!: string | null;

  @Column({ name: 'max_value', type: 'text', nullable: true })
  maxValue!: string | null;

  @Column({ name: 'critical_min', type: 'text', nullable: true })
  criticalMin!: string | null;

  @Column({ name: 'critical_max', type: 'text', nullable: true })
  criticalMax!: string | null;

  @Column({ name: 'turnaround_time_minutes', type: 'int', nullable: true })
  turnaroundTimeMinutes!: number | null;

  @Column({ name: 'test_duration_minutes', type: 'int', nullable: true })
  testDurationMinutes!: number | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'boolean', default: true })
  reportable!: boolean;

  @OneToMany(() => ReferenceRangeEntity, (range) => range.test, { cascade: true })
  referenceRanges!: ReferenceRangeEntity[];
}
