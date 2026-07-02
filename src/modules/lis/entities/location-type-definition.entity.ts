import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';
import { AttributeDefinitionEntity } from './attribute-definition.entity';
import { LisBaseEntity } from './lis-base.entity';

@Entity('lis_location_type_definitions')
export class LocationTypeDefinitionEntity extends LisBaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'allow_children', type: 'boolean', default: false })
  allowChildren!: boolean;

  @ManyToMany(() => LocationTypeDefinitionEntity)
  @JoinTable({
    name: 'lis_location_type_allowed_children',
    joinColumn: { name: 'parent_id' },
    inverseJoinColumn: { name: 'child_id' },
  })
  allowedChildTypes!: LocationTypeDefinitionEntity[];

  @OneToMany(() => AttributeDefinitionEntity, (attr) => attr.appliesToType)
  attributeDefinitions!: AttributeDefinitionEntity[];

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
