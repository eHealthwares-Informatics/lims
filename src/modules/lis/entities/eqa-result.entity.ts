import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { EqaEnrollmentEntity } from './eqa-enrollment.entity';

export type EqaEvaluation = 'PASS' | 'FAIL' | 'WARNING';

@Entity('lis_eqa_results')
export class EqaResultEntity extends LisBaseEntity {
  @ManyToOne(() => EqaEnrollmentEntity)
  @JoinColumn({ name: 'enrollment_id' })
  enrollment!: EqaEnrollmentEntity;

  @Column({ name: 'enrollment_id' })
  enrollmentId!: string;

  @Column({ type: 'text' })
  sampleNumber!: string;

  @Column({ type: 'text', nullable: true })
  value!: string | null;

  @Column({ type: 'text', nullable: true })
  expectedValue!: string | null;

  @Column({ type: 'real', nullable: true })
  zScore!: number | null;

  @Column({ type: 'text', nullable: true })
  evaluation!: EqaEvaluation | null;

  @Column({ type: 'text', nullable: true })
  feedback!: string | null;

  @Column({ type: 'timestamp' })
  submittedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  evaluatedAt!: Date | null;
}
