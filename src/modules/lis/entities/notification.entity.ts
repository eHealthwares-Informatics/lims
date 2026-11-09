import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';

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

  /** Human-readable subject line used when the notification was dispatched. */
  @Column({ type: 'text', nullable: true })
  title!: string | null;

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

  /**
   * Full parameters handed to the conversation dispatch service. Replayed
   * verbatim by `retrigger()` (with a fresh contextId so conversation does not
   * de-duplicate the resend).
   */
  @Column({ name: 'request_payload', type: 'jsonb', nullable: true })
  requestPayload!: Record<string, unknown> | null;

  /** Ledger row this dispatch was re-triggered from, when applicable. */
  @Column({ name: 'retriggered_from_id', type: 'text', nullable: true })
  retriggeredFromId!: string | null;
}
