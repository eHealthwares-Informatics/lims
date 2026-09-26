import { Column, Entity, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { PriorityEntity } from './priority.entity';
import { OrderItemEntity } from './order-item.entity';
import { SampleEntity } from './sample.entity';
import { StatusEntity } from './status.entity';

@Entity('lis_orders')
export class OrderEntity extends LisBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  orderNumber!: string;

  @Column({ type: 'text' })
  patientId!: string;

  /** Human-facing patient identifier (MRN/patient number) from the EMR. */
  @Column({ name: 'patient_number', type: 'text', nullable: true })
  patientNumber!: string | null;

  /** Stable cross-system reference (EMR request number). */
  @Column({ name: 'reference_code', type: 'text', nullable: true })
  referenceCode!: string | null;

  @Column({ type: 'text', nullable: true })
  internalReference!: string | null;

  @Column({ type: 'text', nullable: true })
  externalReference!: string | null;

  @Column({ type: 'text', default: 'MANUAL' })
  source!: string;

  @Column({ type: 'text' })
  patientName!: string;

  @Column({ type: 'int', nullable: true })
  patientAge!: number | null;

  @Column({ type: 'text', nullable: true })
  patientGender!: string | null;

  @Column({ type: 'date', nullable: true })
  patientDateOfBirth!: string | null;

  @Column({ type: 'text', default: 'ENTERED' })
  status!: string;

  @ManyToOne(() => StatusEntity)
  @JoinColumn({ name: 'status_id' })
  statusRef!: StatusEntity | null;

  @Column({ type: 'uuid', nullable: true })
  statusId!: string | null;

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

  @Column({ type: 'simple-json', default: { enter: false, collect: false, label: false, qa: false } })
  stepProgress!: { enter: boolean; collect: boolean; label: boolean; qa: boolean };

  @Column({ type: 'simple-json', default: {} })
  qaChecks!: Record<string, boolean>;

  @Column({ type: 'text', nullable: true })
  requesterName!: string | null;

  @Column({ type: 'text', nullable: true })
  requesterPhone!: string | null;

  @Column({ type: 'text', nullable: true })
  diagnosis!: string | null;

  @Column({ type: 'text', nullable: true })
  clinicalNotes!: string | null;

  @Column({ type: 'date', nullable: true })
  receivedDate!: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'created_by_id' })
  createdById!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => OrderItemEntity, (item) => item.order, { cascade: true })
  items!: OrderItemEntity[];

  @OneToMany(() => SampleEntity, (sample) => sample.order)
  samples!: SampleEntity[];
}
