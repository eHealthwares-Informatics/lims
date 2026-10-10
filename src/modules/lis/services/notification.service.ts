import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { IsNull, Repository } from 'typeorm';
import {
  NotificationDispatchEntity,
  NotificationTemplateEntity,
  NotificationChannel,
} from '../entities';
import { TenantContext } from '../../../common/tenant-context';
import { ConversationDispatchService } from './notification-dispatch.service';

/** Both the trigger event keys and the seeding payload keys. */
export type NotificationEventKey =
  | 'SAMPLE_RECEIVED'
  | 'RESULT_READY'
  | 'RESULT_AMENDED'
  | 'CRITICAL_RESULT'
  | 'PAYMENT_REMINDER'
  | 'ORDER_TAT_BREACH'
  | 'QC_FAILED';

export interface NotificationTriggerContext {
  eventKey: NotificationEventKey;
  platform?: string | null;
  organizationId?: string | null;
  locationId?: string | null;
  /** Bodies keyed by channel type; falls back to `body`. */
  body: string;
  channels?: string[];
  recipient?: {
    phone?: string | null;
    email?: string | null;
  };
  title: string;
  /** Template variables for the conversation engine's outbound template. */
  variables: Record<string, string>;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  audience?: 'PATIENT' | 'DOCTOR' | 'LAB';
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationTemplateEntity)
    private readonly templateRepo: Repository<NotificationTemplateEntity>,
    @InjectRepository(NotificationDispatchEntity)
    private readonly dispatchRepo: Repository<NotificationDispatchEntity>,
    private readonly conversationDispatch: ConversationDispatchService,
    private readonly config: ConfigService,
  ) {}

  /** Idempotency marker so a trigger can't double-fire for the same entity. */
  private static readonly DUPLICATE_WINDOW_HOURS = 24;

  // ------------------------------------------------------------------ templates

  /**
   * Resolves an active template for an event, scoped
   * org/location → default. Seeded defaults are returned when nothing in
   * the database matches (module is functional with zero configuration).
   */
  private async resolveTemplate(
    eventKey: string,
    platform: string | null,
    tenant?: TenantContext,
  ): Promise<NotificationTemplateEntity | null> {
    const load = async (templateCode: string) =>
      this.templateRepo.findOne({
        where: { templateCode, active: true, deletedAt: IsNull() } as any,
      });

    const scopedCode = tenant?.locationId
      ? `${platform ?? eventKey}@${tenant.locationId}`
      : tenant?.organizationId
        ? `${platform ?? eventKey}@${tenant.organizationId}`
        : null;
    if (scopedCode) {
      const scoped = await load(scopedCode);
      if (scoped) return scoped;
    }

    const seeded = await load(`${platform ?? eventKey}@default`);
    if (seeded) return seeded;

    return null;
  }

  async listTemplates(tenant?: TenantContext, eventKey?: string): Promise<NotificationTemplateEntity[]> {
    const qb = this.templateRepo
      .createQueryBuilder('t')
      .where('t.deleted_at IS NULL');
    if (eventKey) qb.andWhere('t.event_key = :eventKey', { eventKey });
    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere('(t.organization_id = :orgId OR t.organization_id IS NULL)', {
        orgId: tenant.organizationId,
      });
      if (tenant.locationId) {
        qb.andWhere('(t.location_id = :locId OR t.location_id IS NULL)', {
          locId: tenant.locationId,
        });
      }
    }
    return qb.orderBy('t.template_code', 'ASC').getMany();
  }

  upsertTemplate(payload: Partial<NotificationTemplateEntity> & { templateCode: string; eventKey: string; audience: string; body: string }): Promise<NotificationTemplateEntity> {
    const entity = this.templateRepo.create({
      templateCode: payload.templateCode,
      eventKey: payload.eventKey,
      audience: payload.audience as any ?? 'PATIENT',
      channels: payload.channels ?? 'SMS',
      body: payload.body,
      language: payload.language ?? 'en',
      channelCodeOverride: payload.channelCodeOverride ?? null,
      active: payload.active ?? true,
      organizationId: payload.organizationId ?? null,
      locationId: payload.locationId ?? null,
    });
    return this.templateRepo.save(entity);
  }

  // ------------------------------------------------------------------ dispatch

  /**
   * Dispatch a notification on all resolvable channels for the recipient's
   * body previews, recording a ledger row per channel. Never throws —
   * notification failures must not fail the LIS business operation.
   */
  private async dispatch(
    trigger: NotificationTriggerContext,
    platform: string | null,
    template: NotificationTemplateEntity | null,
    tenant?: TenantContext,
  ): Promise<void> {
    const channelsRaw = trigger.channels?.length
      ? trigger.channels
      : template
        ? template.channels.split(',').map((c) => c.trim()).filter(Boolean)
        : ['SMS'];

    const channelTypes: NotificationChannel[] = [];
    for (const raw of channelsRaw) {
      const type = raw.toUpperCase() as NotificationChannel;
      if (channelTypes.includes(type)) continue;
      if (type === 'SMS' && trigger.recipient?.phone) channelTypes.push(type);
      else if (type === 'WHATSAPP' && trigger.recipient?.phone) channelTypes.push(type);
      else if (type === 'EMAIL' && trigger.recipient?.email) channelTypes.push(type);
        }

    if (!channelTypes.length) {
      this.logger.warn(
        `[notify:${trigger.eventKey}] no resolvable channel for recipient (phone=${trigger.recipient?.phone ?? 'n/a'} email=${trigger.recipient?.email ?? 'n/a'})`,
      );
      return;
    }

    for (const channelType of channelTypes) {
      const ledger = await this.dispatchRepo.save(
        this.dispatchRepo.create({
          eventKey: trigger.eventKey,
          audience: trigger.audience ?? 'PATIENT',
          recipientAddress: channelType === 'EMAIL' ? trigger.recipient?.email : trigger.recipient?.phone,
          relatedEntityType: trigger.relatedEntityType ?? null,
          relatedEntityId: trigger.relatedEntityId ?? null,
          status: 'PENDING',
          channelCode: template?.channelCodeOverride ?? null,
          templateCodeUsed: template?.templateCode ?? null,
          renderedBody: trigger.body,
        }),
      );

      const result = await this.conversationDispatch.send({
        channelType,
        channelCodeOverride: template?.channelCodeOverride ?? null,
        phone: trigger.recipient?.phone ?? null,
        email: trigger.recipient?.email ?? null,
        title: trigger.title,
        message: trigger.body,
        contextId: `${ledger.id}`,
        sourceApp: 'lis',
        eventType: trigger.eventKey,
        relatedEntityType: trigger.relatedEntityType,
        relatedEntityId: trigger.relatedEntityId,
      });

      await this.dispatchRepo.update(
        { id: ledger.id },
        {
          status: result.ok ? 'SENT' : 'FAILED',
          exchangeId: result.exchangeId ?? null,
          contextId: `${ledger.id}`,
          failureReason: result.error ?? null,
          sentAt: result.ok ? new Date() : null,
          attempts: (ledger.attempts ?? 0) + 1,
        },
      );
    }
  }

  /**
   * Emit a notification event. Fires the matching template(s) for the
   * recipient (audience determines which template set applies).
   */
  async emit(trigger: NotificationTriggerContext, tenant?: TenantContext, platform: string | null = null): Promise<void> {
    try {
      const template = await this.resolveTemplate(trigger.eventKey, platform, tenant);
      await this.dispatch(trigger, platform, template, tenant);
    } catch (error: any) {
      this.logger.error(`[notify:${trigger.eventKey}] dispatch failed: ${error?.message ?? error}`);
    }
  }

  // ------------------------------------------------------------- status sync

  /**
   * Pulls outbound exchanges from the conversations module and mirrors the
   * delivery status onto the LIS dispatch ledger (sender-app copy).
   */
  @Cron('*/15 * * * *')
  async syncDeliveryStatus(): Promise<void> {
    const baseUrl = this.config.get<string>('CONVERSATION_API_URL', 'http://localhost:8090/api');
    const apiKey = this.config.get<string>('INTEROP_API_KEY', 'lis-interop-key-dev');

    const pending = await this.dispatchRepo.find({
      where: { status: 'SENT', exchangeId: IsNull() },
      take: 50,
    });

    for (const ledger of pending) {
      try {
        // Pull-API point: the sender app queries the conversation history by its own
        // context (sourceApp + contextId) rather than the engine messageId.
        const { data } = await axios.get(`${baseUrl}/exchanges/history`, {
          headers: { 'x-api-key': apiKey },
          params: { sourceApp: 'lis', contextId: ledger.contextId, limit: 5 },
          timeout: 10_000,
        });
        const exchange = data?.items?.[0] ?? data?.[0] ?? null;
        if (!exchange) continue;
        await this.dispatchRepo.update(
          { id: ledger.id },
          {
            exchangeId: exchange.id ?? ledger.exchangeId,
            status: exchange.status === 'DELIVERED' ? ('SENT' as const) : ledger.status,
            failureReason: exchange.status === 'FAILED' ? `Exchange ${exchange.id} failed` : ledger.failureReason,
          },
        );
      } catch (error: any) {
        this.logger.warn(`[notify:sync] exchange lookup failed contextId=${ledger.contextId}: ${error?.message}`);
      }
    }
  }

  /** Queue: retry failed dispatches up to 3 attempts. */
  async retryFailed(limit = 20): Promise<void> {
    const failed = await this.dispatchRepo.find({
      where: [{ status: 'FAILED' as const }],
      take: limit,
    });
    for (const ledger of failed) {
      if ((ledger.attempts ?? 0) >= 3) continue;
      await this.dispatchRepo.update(
        { id: ledger.id },
        { status: 'PENDING', failureReason: null },
      );
    }
  }

  /** Idempotency: true when a dispatch already exists for this entity+event. */
  async hasDispatch(eventKey: string, relatedEntityType: string, relatedEntityId: string): Promise<boolean> {
    const count = await this.dispatchRepo.count({
      where: {
        eventKey,
        relatedEntityType,
        relatedEntityId,
        deletedAt: IsNull(),
      } as any,
    });
    return count > 0;
  }

  listDispatches(
    query: { eventKey?: string; status?: string; relatedEntityId?: string; audience?: string },
    tenant?: TenantContext,
  ): Promise<{ data: NotificationDispatchEntity[]; total: number }> {
    const qb = this.dispatchRepo
      .createQueryBuilder('d')
      .where('d.deleted_at IS NULL');
    if (query.eventKey) qb.andWhere('d.event_key = :eventKey', { eventKey: query.eventKey });
    if (query.status) qb.andWhere('d.status = :status', { status: query.status });
    if (query.audience) qb.andWhere('d.audience = :audience', { audience: query.audience });
    if (query.relatedEntityId) {
      qb.andWhere('d.related_entity_id = :relatedEntityId', { relatedEntityId: query.relatedEntityId });
    }
    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere('(d.organization_id = :orgId OR d.organization_id IS NULL)', {
        orgId: tenant.organizationId,
      });
      if (tenant.locationId) {
        qb.andWhere('(d.location_id = :locId OR d.location_id IS NULL)', {
          locId: tenant.locationId,
        });
      }
    }
    return qb
      .orderBy('d.created_at', 'DESC')
      .take(100)
      .getManyAndCount()
      .then(([data, total]) => ({ data, total }));
  }
}
