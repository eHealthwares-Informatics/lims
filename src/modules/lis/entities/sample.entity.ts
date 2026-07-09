import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { OrderEntity } from './order.entity';
import { StatusEntity } from './status.entity';

@Entity('lis_samples')
export class SampleEntity extends LisBaseEntity {
  @Column({ type: 'text' })
  barcode!: string;

  @ManyToOne(() => OrderEntity)
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ name: 'order_id' })
  orderId!: string;

  @ManyToOne(() => StatusEntity)
  @JoinColumn({ name: 'status_id' })
  status!: StatusEntity;

  @Column({ name: 'status_id' })
  statusId!: string;

  @Column({ type: 'text', nullable: true })
  sampleType!: string | null;

  @Column({ type: 'text', nullable: true })
  collector!: string | null;

  @Column({ type: 'date', nullable: true })
  collectionDate!: Date | null;

  @Column({ type: 'date', nullable: true })
  receivedDate!: Date | null;

  @Column({ type: 'text', nullable: true })
  collectionMethod!: string | null;

  @Column({ type: 'text', nullable: true })
  collectionConditions!: string | null;

  @Column({ type: 'real', nullable: true })
  quantity!: number | null;

  @Column({ type: 'text', nullable: true })
  rejectionReasonId!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'boolean', default: false })
  rejected!: boolean;
}
