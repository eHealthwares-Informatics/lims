import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';

export type NotificationChannel = 'SMS' | 'WHATSAPP' | 'EMAIL';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';
export type NotificationAudience = 'PATIENT' | 'DOCTOR' | 'LAB';

/**
 * Sender-app ledger: one row per outbound notification conversation message
 * sent to the conversations module. Delivery status is mirrored from the
 * exchange that the channel sender recorded.
 */
@Entity('lis_notification_dispatches')
export class NotificationDispatchEntity extends LisBaseEntity {
  @Index()
  @Column({ type: 'text' })
  eventKey!: string;

  @Column({ type: 'text', nullable: true })
  audience!: NotificationAudience | null;

  /** Recipient address used by the conversation channel (phone or email). */
  @Column({ type: 'text', nullable: true })
  recipientAddress!: string | null;

  /** Channel-level identifier (LIS_SAMPLE / LIS_RESULT etc). */
  @Column({ type: 'text', nullable: true })
  relatedEntityType!: string | null;

  @Column({ type: 'text', nullable: true })
  relatedEntityId!: string | null;

  @Column({ type: 'text', default: 'PENDING' })
  status!: NotificationStatus;

  /** Conversation-engine exchange id, so delivery state can be pulled back. */
  @Column({ type: 'text', nullable: true })
  exchangeId!: string | null;

  /** Conversation-engine messageId (opts into exchange dedupe by contextId). */
  @Column({ type: 'text', nullable: true })
  contextId!: string | null;

  @Column({ type: 'text', nullable: true })
  channelCode!: string | null;

  /** Primary channel when this row is a fallback attempt. */
  @Column({ name: 'fallback_from', type: 'text', nullable: true })
  fallbackFrom!: string | null;

  @Column({ type: 'text', nullable: true })
  templateCodeUsed!: string | null;

  /** Rendered body actually dispatched. */
  @Column({ type: 'text', nullable: true })
  renderedBody!: string | null;

  /** Error detail when status = FAILED. */
  @Column({ type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  sentAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  attempts!: number;
}
