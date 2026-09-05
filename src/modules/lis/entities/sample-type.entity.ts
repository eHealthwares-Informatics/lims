import { Column, Entity, Index } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';

@Entity('lis_sample_types')
export class SampleTypeEntity extends LisBaseEntity {
  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Index({ unique: true })
  @Column({ type: 'text' })
  key!: string;

  @Column({ name: 'accession_code', type: 'varchar', length: 3 })
  accessionCode!: string;

  @Column({ name: 'default_quantity', type: 'real', nullable: true })
  defaultQuantity!: number | null;

  @Column({ name: 'minimum_quantity', type: 'real', nullable: true })
  minimumQuantity!: number | null;

  @Column({ type: 'text', nullable: true })
  unit!: string | null;

  @Column({ name: 'container_type', type: 'text', nullable: true })
  containerType!: string | null;

  @Column({ name: 'collection_instructions', type: 'text', nullable: true })
  collectionInstructions!: string | null;

  @Column({ name: 'storage_requirements', type: 'text', nullable: true })
  storageRequirements!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
