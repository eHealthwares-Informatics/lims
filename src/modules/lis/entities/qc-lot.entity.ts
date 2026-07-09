import { Column, Entity } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';

@Entity('lis_qc_lots')
export class QcLotEntity extends LisBaseEntity {
  @Column({ type: 'text' })
  controlName!: string;

  @Column({ type: 'text' })
  lotNumber!: string;

  @Column({ type: 'date', nullable: true })
  expiryDate!: string | null;

  @Column({ type: 'text', nullable: true })
  manufacturer!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  testConfig!: QcLotTestConfig[] | null;
}

export interface QcLotTestConfig {
  testDefinitionId: string;
  mean: number;
  sd: number;
  testName?: string;
}
