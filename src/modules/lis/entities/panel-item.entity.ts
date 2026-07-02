import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { PanelEntity } from './panel.entity';
import { TestDefinitionEntity } from './test-definition.entity';

@Entity('lis_panel_items')
export class PanelItemEntity extends LisBaseEntity {
  @ManyToOne(() => PanelEntity, (panel) => panel.panelItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'panel_id' })
  panel!: PanelEntity;

  @ManyToOne(() => TestDefinitionEntity)
  @JoinColumn({ name: 'test_definition_id' })
  test!: TestDefinitionEntity;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}
