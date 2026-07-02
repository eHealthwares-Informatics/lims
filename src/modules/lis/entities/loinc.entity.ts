import { Column, Entity, Index } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';

@Entity('lis_loinc_codes')
export class LoincEntity extends LisBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  system!: string | null;

  @Column({ type: 'text', nullable: true })
  component!: string | null;

  @Column({ type: 'text', nullable: true })
  property!: string | null;

  @Column({ type: 'text', nullable: true })
  scale!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
