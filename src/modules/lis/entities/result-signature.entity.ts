import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { ResultEntity } from './result.entity';

@Entity('lis_result_signatures')
export class ResultSignatureEntity extends LisBaseEntity {
  @ManyToOne(() => ResultEntity)
  @JoinColumn({ name: 'result_id' })
  result!: ResultEntity;

  @Column({ name: 'result_id', type: 'uuid' })
  resultId!: string;

  @Column({ type: 'text', nullable: true })
  userId!: string | null;

  @Column({ type: 'text', nullable: true })
  userName!: string | null;

  @Column({ type: 'boolean', default: false })
  isSupervisor!: boolean;

  @Column({ type: 'text', nullable: true })
  signatureData!: string | null;

  @Column({ type: 'date' })
  signedAt!: Date;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
