import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { StatusEntity } from './status.entity';

@Entity('lis_status_history')
export class StatusHistoryEntity extends LisBaseEntity {
  @Column({ type: 'text' })
  entityType!: string;

  @Column({ type: 'text' })
  entityId!: string;

  @ManyToOne(() => StatusEntity)
  @JoinColumn({ name: 'from_status_id' })
  fromStatus!: StatusEntity | null;

  @Column({ name: 'from_status_id', nullable: true })
  fromStatusId!: string | null;

  @ManyToOne(() => StatusEntity)
  @JoinColumn({ name: 'to_status_id' })
  toStatus!: StatusEntity;

  @Column({ name: 'to_status_id' })
  toStatusId!: string;

  @Column({ type: 'text', nullable: true })
  changedBy!: string | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;
}
