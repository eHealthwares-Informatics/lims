import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { QcResultEntity } from './qc-result.entity';

export type WestgardRule = '1-2s' | '1-3s' | '2-2s' | 'R-4s' | '4-1s' | '10x';
export type AlertSeverity = 'WARNING' | 'REJECT';

@Entity('lis_qc_alerts')
export class QcAlertEntity extends LisBaseEntity {
  @ManyToOne(() => QcResultEntity)
  @JoinColumn({ name: 'qc_result_id' })
  qcResult!: QcResultEntity;

  @Column({ name: 'qc_result_id' })
  qcResultId!: string;

  @Column({ type: 'text' })
  rule!: WestgardRule;

  @Column({ type: 'text' })
  severity!: AlertSeverity;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  acknowledgedBy!: string | null;
}
