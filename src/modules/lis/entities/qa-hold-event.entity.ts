import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { ResultEntity } from './result.entity';

@Entity('lis_qa_hold_events')
export class QaHoldEventEntity extends LisBaseEntity {
  @ManyToOne(() => ResultEntity)
  @JoinColumn({ name: 'result_id' })
  result!: ResultEntity;

  @Column({ name: 'result_id', type: 'uuid' })
  resultId!: string;

  @Column({ type: 'text' })
  action!: 'HOLD' | 'RELEASE';

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ name: 'reviewer_id', type: 'text', nullable: true })
  reviewerId!: string | null;

  @Column({ name: 'previous_status', type: 'text', nullable: true })
  previousStatus!: string | null;

  @Column({ name: 'restored_status', type: 'text', nullable: true })
  restoredStatus!: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp!: Date;
}