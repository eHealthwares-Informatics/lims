import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { OrderEntity } from './order.entity';
import { TestDefinitionEntity } from './test-definition.entity';

@Entity('lis_order_items')
export class OrderItemEntity extends LisBaseEntity {
  @ManyToOne(() => OrderEntity, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order!: OrderEntity;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => TestDefinitionEntity)
  @JoinColumn({ name: 'test_definition_id' })
  testDefinition!: TestDefinitionEntity;

  @Column({ type: 'uuid' })
  testDefinitionId!: string;

  @Column({ type: 'text', default: 'PENDING' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  resultValue!: string | null;

  @Column({ type: 'date', nullable: true })
  resultDate!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
