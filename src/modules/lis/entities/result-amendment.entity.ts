import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { ResultEntity } from './result.entity';

@Entity('lis_result_amendments')
export class ResultAmendmentEntity extends LisBaseEntity {
  @ManyToOne(() => ResultEntity)
  @JoinColumn({ name: 'result_id' })
  result!: ResultEntity;

  @Column({ name: 'result_id', type: 'uuid' })
  resultId!: string;

  @Column({ name: 'amendment_number', type: 'integer', default: 1 })
  amendmentNumber!: number;

  @Column({ type: 'text' })
  reason!: string;

  @Column({ name: 'previous_value', type: 'text', nullable: true })
  previousValue!: string | null;

  @Column({ name: 'corrected_value', type: 'text', nullable: true })
  correctedValue!: string | null;

  @Column({ name: 'corrected_by_id', type: 'text', nullable: true })
  correctedById!: string | null;

  @Column({ name: 'corrected_at', type: 'timestamp', nullable: true })
  correctedAt!: Date | null;

  @Column({ name: 'previous_status', type: 'text', nullable: true })
  previousStatus!: string | null;

  @Column({ name: 'new_status', type: 'text', nullable: true })
  newStatus!: string | null;

  @Column({ name: 'superseded_result_id', type: 'uuid', nullable: true })
  supersededResultId!: string | null;
}