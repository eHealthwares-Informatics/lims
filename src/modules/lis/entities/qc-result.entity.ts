import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { QcLotEntity } from './qc-lot.entity';
import { TestDefinitionEntity } from './test-definition.entity';
import { QcAlertEntity } from './qc-alert.entity';

@Entity('lis_qc_results')
export class QcResultEntity extends LisBaseEntity {
  @ManyToOne(() => QcLotEntity)
  @JoinColumn({ name: 'qc_lot_id' })
  qcLot!: QcLotEntity;

  @Column({ name: 'qc_lot_id' })
  qcLotId!: string;

  @ManyToOne(() => TestDefinitionEntity)
  @JoinColumn({ name: 'test_definition_id' })
  testDefinition!: TestDefinitionEntity;

  @Column({ name: 'test_definition_id' })
  testDefinitionId!: string;

  @Column({ type: 'real' })
  value!: number;

  @Column({ type: 'timestamp', nullable: true })
  measuredAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  instrument!: string | null;

  @Column({ type: 'text', nullable: true })
  technician!: string | null;

  @Column({ type: 'boolean', default: true })
  inControl!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
