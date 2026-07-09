import { Column, Entity, Index } from 'typeorm';
import { LisBaseEntity, StatusDomain } from './lis-base.entity';

@Entity('lis_statuses')
export class StatusEntity extends LisBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text' })
  domain!: StatusDomain;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
