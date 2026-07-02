import { Column, Entity, OneToMany } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { PanelItemEntity } from './panel-item.entity';

@Entity('lis_panels')
export class PanelEntity extends LisBaseEntity {
  @Column({ type: 'text', unique: true })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @OneToMany(() => PanelItemEntity, (item) => item.panel, { cascade: true })
  panelItems!: PanelItemEntity[];

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
