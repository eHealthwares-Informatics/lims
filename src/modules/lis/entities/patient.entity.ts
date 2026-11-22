import { Column, Entity, Index } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';

@Entity('lis_patients')
export class PatientEntity extends LisBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  patientId!: string;

  @Column({ type: 'text' })
  firstName!: string;

  @Column({ type: 'text' })
  lastName!: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth!: string | null;

  @Column({ type: 'text', nullable: true })
  gender!: string | null;

  @Column({ type: 'text', nullable: true })
  phone!: string | null;

  /**
   * Identity-service user id, when this patient uses the patient app. Linking
   * on the id is preferred over the phone so a changed number keeps one record.
   */
  @Index()
  @Column({ name: 'external_user_id', type: 'text', nullable: true })
  externalUserId!: string | null;

  /** Conversation-engine participant id, when the patient came from a chat. */
  @Index()
  @Column({ name: 'participant_id', type: 'text', nullable: true })
  participantId!: string | null;

  @Column({ type: 'text', nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;
}
