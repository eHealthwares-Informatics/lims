import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';
import { TestDefinitionEntity } from './test-definition.entity';

@Entity('lis_programs')
export class ProgramEntity extends LisBaseEntity {
  @Column({ type: 'text', unique: true })
  code!: string;

  @Column({ type: 'text', unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToMany(() => TestDefinitionEntity, (test) => test.programs)
  @JoinTable({
    name: 'lis_program_test_definitions',
    joinColumn: { name: 'program_id' },
    inverseJoinColumn: { name: 'test_definition_id' },
  })
  testDefinitions!: TestDefinitionEntity[];

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
