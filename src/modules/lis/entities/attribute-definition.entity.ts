import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { LocationTypeDefinitionEntity } from './location-type-definition.entity';

export enum LisAttributeDataType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
}

@Entity('lis_attribute_definitions')
export class AttributeDefinitionEntity extends LisBaseEntity {
  @Column({ type: 'text' })
  key!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'enum', enum: LisAttributeDataType, default: LisAttributeDataType.TEXT })
  dataType!: LisAttributeDataType;

  @ManyToOne(() => LocationTypeDefinitionEntity, (type) => type.attributeDefinitions, { nullable: false })
  @JoinColumn({ name: 'applies_to_type_id' })
  appliesToType!: LocationTypeDefinitionEntity;

  @Column({ type: 'boolean', default: false })
  required!: boolean;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
