import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { LoincEntity } from './loinc.entity';
import { MethodEntity } from './method.entity';
import { ProgramEntity } from './program.entity';
import { ReferenceRangeEntity } from './reference-range.entity';
import { SampleTypeEntity } from './sample-type.entity';
import { TestCategoryEntity } from './test-category.entity';
import { TestSectionEntity } from './test-section.entity';
import { UnitOfMeasurementEntity } from './uom.entity';

export enum TestResultType {
  NUMERIC = 'NUMERIC',
  TEXT = 'TEXT',
  DICTIONARY = 'DICTIONARY',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  RICH_TEXT = 'RICH_TEXT',
  ATTACHMENT = 'ATTACHMENT',
  TABLE = 'TABLE',
  CALCULATED = 'CALCULATED',
}

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

  @ManyToOne(() => MethodEntity, { nullable: true })
  @JoinColumn({ name: 'method_id' })
  method!: MethodEntity | null;

  @ManyToOne(() => TestSectionEntity, { nullable: true })
  @JoinColumn({ name: 'test_section_id' })
  testSection!: TestSectionEntity | null;

  @ManyToOne(() => UnitOfMeasurementEntity, { nullable: true })
  @JoinColumn({ name: 'uom_id' })
  uom!: UnitOfMeasurementEntity | null;

  @Column({ name: 'result_type', type: 'enum', enum: TestResultType, default: TestResultType.NUMERIC })
  resultType!: TestResultType;

  @Column({ name: 'validation_rules', type: 'jsonb', nullable: true })
  validationRules!: Record<string, unknown> | null;

  @ManyToMany(() => SampleTypeEntity)
  @JoinTable({
    name: 'lis_test_definition_sample_types',
    joinColumn: { name: 'test_definition_id' },
    inverseJoinColumn: { name: 'sample_type_id' },
  })
  sampleTypes!: SampleTypeEntity[];

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'boolean', default: true })
  reportable!: boolean;

  @Column({ type: 'text', nullable: true })
  minValue!: string | null;

  @Column({ type: 'text', nullable: true })
  maxValue!: string | null;

  @Column({ type: 'text', nullable: true })
  criticalMin!: string | null;

  @Column({ type: 'text', nullable: true })
  criticalMax!: string | null;

  @Column({ type: 'int', nullable: true })
  turnaroundTimeMinutes!: number | null;

  @Column({ type: 'int', nullable: true })
  testDurationMinutes!: number | null;

  @OneToMany(() => ReferenceRangeEntity, (range) => range.test, { cascade: true })
  referenceRanges!: ReferenceRangeEntity[];
}
