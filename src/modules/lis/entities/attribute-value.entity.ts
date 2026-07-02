import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { AttributeDefinitionEntity } from './attribute-definition.entity';
import { LisBaseEntity } from './lis-base.entity';
import { LocationEntity } from './location.entity';

@Entity('lis_attribute_values')
export class AttributeValueEntity extends LisBaseEntity {
  @ManyToOne(() => LocationEntity, (location) => location.attributeValues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'location_id' })
  location!: LocationEntity;

  @ManyToOne(() => AttributeDefinitionEntity, { eager: true, nullable: false })
  @JoinColumn({ name: 'attribute_definition_id' })
  definition!: AttributeDefinitionEntity;

  @Column({ type: 'text', nullable: true })
  value!: string | null;
}
