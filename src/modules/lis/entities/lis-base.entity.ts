import { Column, CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export abstract class LisBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId!: string | null;

  @Column({ name: 'location_id', type: 'text', nullable: true })
  locationId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;
}

export type OrderStatus = 'ENTERED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type SampleStatus = 'COLLECTED' | 'RECEIVED' | 'IN_PROGRESS' | 'DISPOSED' | 'REJECTED';
export type ResultStatus = 'PENDING' | 'TECHNICAL_REVIEW' | 'FINALIZED' | 'CANCELLED' | 'QA_HOLD';
export type StatusDomain = 'ORDER' | 'SAMPLE' | 'RESULT';
