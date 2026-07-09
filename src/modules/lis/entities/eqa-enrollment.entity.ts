import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { EqaProgramEntity } from './eqa-program.entity';
import { TestDefinitionEntity } from './test-definition.entity';

export type EqaEnrollmentStatus = 'ENROLLED' | 'SAMPLES_RECEIVED' | 'RESULTS_SUBMITTED' | 'EVALUATED';

@Entity('lis_eqa_enrollments')
export class EqaEnrollmentEntity extends LisBaseEntity {
  @ManyToOne(() => EqaProgramEntity)
  @JoinColumn({ name: 'program_id' })
  program!: EqaProgramEntity;

  @Column({ name: 'program_id' })
  programId!: string;

  @ManyToOne(() => TestDefinitionEntity)
  @JoinColumn({ name: 'test_definition_id' })
  testDefinition!: TestDefinitionEntity;

  @Column({ name: 'test_definition_id' })
  testDefinitionId!: string;

  @Column({ type: 'text' })
  roundLabel!: string;

  @Column({ type: 'text', default: 'ENROLLED' })
  status!: EqaEnrollmentStatus;

  @Column({ type: 'timestamp' })
  enrolledAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  evaluatedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
