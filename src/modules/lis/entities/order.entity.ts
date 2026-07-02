import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { PatientEntity } from './patient.entity';
import { PriorityEntity } from './priority.entity';
import { OrderItemEntity } from './order-item.entity';

@Entity('lis_orders')
export class OrderEntity extends LisBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  orderNumber!: string;

  @ManyToOne(() => PatientEntity)
  @JoinColumn({ name: 'patient_id' })
  patient!: PatientEntity;

  @Column({ type: 'uuid' })
  patientId!: string;

  @Column({ type: 'text', default: 'PENDING' })
  status!: string;

  @ManyToOne(() => PriorityEntity, { nullable: true })
  @JoinColumn({ name: 'priority_id' })
  priority!: PriorityEntity | null;

  @Column({ type: 'uuid', nullable: true })
  priorityId!: string | null;

  @Column({ type: 'date', nullable: true })
  requestedDate!: string | null;

  @Column({ type: 'date', nullable: true })
  collectedDate!: string | null;

  @Column({ type: 'date', nullable: true })
  completedDate!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true })
  items!: OrderItemEntity[];
}
