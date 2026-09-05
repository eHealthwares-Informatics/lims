import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { AttributeValueEntity } from './attribute-value.entity';
import { LisBaseEntity } from './lis-base.entity';
import { LocationTypeDefinitionEntity } from './location-type-definition.entity';

@Entity('lis_locations')
export class LocationEntity extends LisBaseEntity {
  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', unique: true, nullable: true })
  reference!: string | null;

  @ManyToOne(() => LocationTypeDefinitionEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'type_id' })
  type!: LocationTypeDefinitionEntity;

  @ManyToOne(() => LocationEntity, (location) => location.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: LocationEntity | null;

  @OneToMany(() => LocationEntity, (location) => location.parent)
  children!: LocationEntity[];

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'boolean', default: false })
  storageAssignment!: boolean;

  @OneToMany(() => AttributeValueEntity, (value) => value.location, { cascade: true })
  attributeValues!: AttributeValueEntity[];
}
