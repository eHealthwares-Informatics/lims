import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { LisBaseEntity } from './lis-base.entity';

export type NotificationChannel = 'SMS' | 'WHATSAPP' | 'EMAIL';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';
export type NotificationAudience = 'PATIENT' | 'DOCTOR' | 'LAB';

/**
 * Configurable message template per event, scoped to organization/location
 * and (optionally) a language variant. Falls back to the default (scope-less)
 * template with the same code when no scoped match exists.
 */
@Entity('lis_notification_templates')
export class NotificationTemplateEntity extends LisBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text' })
  templateCode!: string;

  /** Event key this template fires for, e.g. SAMPLE_RECEIVED, RESULT_FINALIZED. */
  @Index()
  @Column({ type: 'text' })
  eventKey!: string;

  @Column({ type: 'text' })
  audience!: NotificationAudience;

  /**
   * Comma-separated channel preference, resolved left-to-right against the
   * data we hold for the recipient (e.g. "WHATSAPP,SMS,EMAIL").
   */
  @Column({ type: 'text', default: 'SMS' })
  channels!: string;

  /** Message body. `{{field}}` tokens are replaced from the trigger context. */
  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'text', default: 'en' })
  language!: string;

  /** Optional conversation-engine channel code override (defaults per type). */
  @Column({ type: 'text', nullable: true })
  channelCodeOverride!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}

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

  template!: NotificationTemplateEntity | null;
}
