import { Column, Entity } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';

export type QaChecklistCategory =
  | 'ORDER_ENTRY'
  | 'SPECIMEN'
  | 'TEST'
  | 'RESULT_ENTRY'
  | 'VALIDATION';

@Entity('lis_qa_checklist_items')
export class QaChecklistItemEntity extends LisBaseEntity {
  @Column({ type: 'text' })
  code!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'text', default: 'ORDER_ENTRY' })
  category!: QaChecklistCategory;

  @Column({ type: 'boolean', default: true })
  required!: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
