import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { OrderItemEntity } from './order-item.entity';
import { UnitOfMeasurementEntity } from './uom.entity';
import { ReferenceRangeEntity } from './reference-range.entity';
import { StatusEntity } from './status.entity';

@Entity('lis_results')
export class ResultEntity extends LisBaseEntity {
  @ManyToOne(() => OrderItemEntity)
  @JoinColumn({ name: 'order_item_id' })
  orderItem!: OrderItemEntity;

  @Column({ type: 'uuid' })
  orderItemId!: string;

  @Column({ type: 'text', nullable: true })
  value!: string | null;

  @ManyToOne(() => UnitOfMeasurementEntity, { nullable: true })
  @JoinColumn({ name: 'unit_id' })
  unit!: UnitOfMeasurementEntity | null;

  @Column({ type: 'uuid', nullable: true })
  unitId!: string | null;

  @ManyToOne(() => ReferenceRangeEntity, { nullable: true })
  @JoinColumn({ name: 'reference_range_id' })
  referenceRange!: ReferenceRangeEntity | null;

  @Column({ type: 'uuid', nullable: true })
  referenceRangeId!: string | null;

  @Column({ type: 'text', default: 'PENDING' })
  status!: string;

  @ManyToOne(() => StatusEntity)
  @JoinColumn({ name: 'status_id' })
  statusRef!: StatusEntity | null;

  @Column({ type: 'uuid', nullable: true })
  statusId!: string | null;

  @Column({ type: 'text', nullable: true })
  enteredById!: string | null;

  @Column({ type: 'date', nullable: true })
  enteredDate!: string | null;

  @Column({ type: 'text', nullable: true })
  validatedById!: string | null;

  @Column({ type: 'date', nullable: true })
  validatedDate!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt!: string | null;
}
