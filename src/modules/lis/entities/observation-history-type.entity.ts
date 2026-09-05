import { Column, Entity, Index } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';

@Entity('lis_observation_history_types')
export class ObservationHistoryTypeEntity extends LisBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  typeName!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', nullable: true })
  openelisId!: string | null;
}
