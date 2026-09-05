import { Column, Entity, Index } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';

@Entity('lis_reference_tables')
export class ReferenceTableEntity extends LisBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'boolean', default: false })
  keepHistory!: boolean;

  @Column({ type: 'boolean', default: false })
  isHl7Encoded!: boolean;

  @Column({ type: 'text', nullable: true })
  openelisId!: string | null;
}
