import { Column, Entity, Index } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';

@Entity('lis_source_of_samples')
export class SourceOfSampleEntity extends LisBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  code!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text', default: 'H' })
  domain!: string;

  @Column({ type: 'text', nullable: true })
  openelisId!: string | null;
}
