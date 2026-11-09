import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { IsNull, Repository } from "typeorm";
import { NotificationDispatchEntity } from "../entities";
import { TenantContext } from "../../../common/tenant-context";
import { ConversationDispatchService } from "./notification-dispatch.service";

/** Both the trigger event keys and the seeding payload keys. */
export type NotificationEventKey =
  | "SAMPLE_RECEIVED"
  | "RESULT_READY"
  | "RESULT_AMENDED"
  | "CRITICAL_RESULT"
  | "PAYMENT_REMINDER"
  | "ORDER_TAT_BREACH"
  | "QC_FAILED";

/**
 * The exact parameters handed to `ConversationDispatchService.send`, persisted
 * on the ledger row so a dispatch can be replayed faithfully.
 */
export type LisDispatchRequestPayload = {
  organizationId: string | null;
  /** Conversation event key (after LIS→conversation mapping). */
  eventKey: string;
  /** Original LIS trigger key (e.g. RESULT_READY). */
  eventType: string;
  recipients: { phone?: string | null; email?: string | null };
  context: Record<string, unknown>;
  sourceApp: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
};

export interface NotificationTriggerContext {
  eventKey: NotificationEventKey;
  platform?: string | null;
  organizationId?: string | null;
  locationId?: string | null;
  body: string;
  recipient?: {
    phone?: string | null;
    email?: string | null;
  };
  title: string;
  /** Template variables for the conversation engine's outbound template. */
  variables: Record<string, string>;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  audience?: "PATIENT" | "DOCTOR" | "LAB";
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationDispatchEntity)
    private readonly dispatchRepo: Repository<NotificationDispatchEntity>,
    private readonly conversationDispatch: ConversationDispatchService,
    private readonly config: ConfigService,
  ) {}

  /** Idempotency marker so a trigger can't double-fire for the same entity. */
  private static readonly DUPLICATE_WINDOW_HOURS = 24;

  // ------------------------------------------------------------------ dispatch

  /**
   * Dispatch one notification event through the conversation engine.
   *
   * Conversation owns template + channel resolution, so LIS makes a single call
   * per event with `{ eventKey, organizationId, recipients, context }` and
   * records one sender-app ledger row. Never throws — a notification failure
   * must not fail the LIS business operation.
   */
  private async dispatch(
    trigger: NotificationTriggerContext,
    platform: string | null,
    tenant?: TenantContext,
  ): Promise<void> {
    const organizationId = tenant?.organizationId ?? null;
    const recipients = {
      phone: trigger.recipient?.phone ?? null,
      email: trigger.recipient?.email ?? null,
    };
    if (!recipients.phone && !recipients.email) {
      this.logger.warn(
        `[notify:${trigger.eventKey}] no recipient (phone/email) — skipping`,
      );
      return;
    }

    const context: Record<string, unknown> = {
      source: "lis-notification",
      sourceApp: "lis",
      eventType: trigger.eventKey,
      platform,
      audience: trigger.audience ?? "PATIENT",
      locationId: trigger.locationId ?? tenant?.locationId ?? null,
      relatedEntityType: trigger.relatedEntityType ?? null,
      relatedEntityId: trigger.relatedEntityId ?? null,
      title: trigger.title,
      message: trigger.body,
      ...trigger.variables,
    };

    const requestPayload: LisDispatchRequestPayload = {
      organizationId,
      eventKey: trigger.eventKey,
      eventType: trigger.eventKey,
      recipients,
      context,
      sourceApp: "lis",
      title: trigger.title,
      message: trigger.body,
      relatedEntityType: trigger.relatedEntityType ?? null,
      relatedEntityId: trigger.relatedEntityId ?? null,
    };

    const ledger = await this.dispatchRepo.save(
      this.dispatchRepo.create({
        organizationId,
        locationId: trigger.locationId ?? tenant?.locationId ?? null,
        eventKey: trigger.eventKey,
        title: trigger.title,
        audience: trigger.audience ?? "PATIENT",
        recipientAddress: recipients.email ?? recipients.phone,
        relatedEntityType: trigger.relatedEntityType ?? null,
        relatedEntityId: trigger.relatedEntityId ?? null,
        status: "PENDING",
        renderedBody: trigger.body,
        requestPayload: requestPayload as unknown as Record<string, unknown>,
      }),
    );

    const result = await this.conversationDispatch.send({
      organizationId,
      eventType: trigger.eventKey,
      phone: recipients.phone,
      email: recipients.email,
      title: trigger.title,
      message: trigger.body,
      context,
      contextId: `${ledger.id}`,
      sourceApp: "lis",
      relatedEntityType: trigger.relatedEntityType ?? null,
      relatedEntityId: trigger.relatedEntityId ?? null,
    });

    await this.dispatchRepo.update(
      { id: ledger.id },
      {
        status: result.ok ? "SENT" : "FAILED",
        exchangeId: result.deliveries[0] ?? null,
        contextId: `${ledger.id}`,
        failureReason: result.error ?? null,
        sentAt: result.ok ? new Date() : null,
        attempts: (ledger.attempts ?? 0) + 1,
      },
    );
  }

  /**
   * Replays a ledger row through the conversation engine. Creates a NEW ledger
   * entry linked to the original (`retriggeredFromId`) so the audit trail shows
   * both attempts; conversation de-dupe is bypassed with a fresh contextId.
   */
  async retrigger(
    id: string,
    tenant?: TenantContext,
  ): Promise<{ ok: boolean; dispatchId: string }> {
    const original = await this.dispatchRepo.findOne({ where: { id } });
    if (!original) {
      throw new NotFoundException("Notification dispatch not found");
    }

    const stored = (original.requestPayload ?? {}) as Partial<LisDispatchRequestPayload>;
    const eventType = stored.eventType ?? original.eventKey;
    const recipients =
      stored.recipients ??
      ({
        phone: original.recipientAddress,
        email: null,
      } as { phone?: string | null; email?: string | null });
    const organizationId =
      original.organizationId ?? tenant?.organizationId ?? stored.organizationId ?? null;
    const title = stored.title ?? original.title ?? original.eventKey;
    const message = stored.message ?? original.renderedBody ?? "";
    const context = stored.context ?? {};

    const ledger = await this.dispatchRepo.save(
      this.dispatchRepo.create({
        organizationId,
        locationId: original.locationId ?? tenant?.locationId ?? null,
        eventKey: original.eventKey,
        title,
        audience: original.audience,
        recipientAddress: original.recipientAddress,
        relatedEntityType: stored.relatedEntityType ?? original.relatedEntityType ?? null,
        relatedEntityId: stored.relatedEntityId ?? original.relatedEntityId ?? null,
        status: "PENDING",
        renderedBody: message,
        requestPayload: {
          organizationId,
          eventKey: original.eventKey,
          eventType,
          recipients,
          context,
          sourceApp: "lis",
          title,
          message,
          relatedEntityType: stored.relatedEntityType ?? original.relatedEntityType ?? null,
          relatedEntityId: stored.relatedEntityId ?? original.relatedEntityId ?? null,
        } as unknown as Record<string, unknown>,
        retriggeredFromId: original.id,
      }),
    );

    const result = await this.conversationDispatch.send({
      organizationId,
      eventType,
      phone: recipients.phone ?? null,
      email: recipients.email ?? null,
      title,
      message,
      context,
      contextId: `${ledger.id}`,
      sourceApp: "lis",
      relatedEntityType: stored.relatedEntityType ?? original.relatedEntityType ?? null,
      relatedEntityId: stored.relatedEntityId ?? original.relatedEntityId ?? null,
    });

    await this.dispatchRepo.update(
      { id: ledger.id },
      {
        status: result.ok ? "SENT" : "FAILED",
        exchangeId: result.deliveries[0] ?? null,
        contextId: `${ledger.id}`,
        failureReason: result.error ?? null,
        sentAt: result.ok ? new Date() : null,
        attempts: 1,
      },
    );

    return { ok: result.ok, dispatchId: ledger.id };
  }

  /**
   * Emit a notification event. Conversation resolves the template and channels
   * from the event key; LIS supplies recipients + template context.
   */
  async emit(
    trigger: NotificationTriggerContext,
    tenant?: TenantContext,
    platform: string | null = null,
  ): Promise<void> {
    try {
      await this.dispatch(trigger, platform, tenant);
    } catch (error: any) {
      this.logger.error(
        `[notify:${trigger.eventKey}] dispatch failed: ${error?.message ?? error}`,
      );
    }
  }

  // ------------------------------------------------------------- status sync

  /**
   * Pulls outbound exchanges from the conversations module and mirrors the
   * delivery status onto the LIS dispatch ledger (sender-app copy).
   */
  @Cron("*/15 * * * *")
  async syncDeliveryStatus(): Promise<void> {
    const baseUrl = this.config.get<string>(
      "CONVERSATION_API_URL",
      "http://localhost:8090/api",
    );
    const apiKey = this.config.get<string>(
      "INTEROP_API_KEY",
      "lis-interop-key-dev",
    );

    const pending = await this.dispatchRepo.find({
      where: { status: "SENT", exchangeId: IsNull() },
      take: 50,
    });

    for (const ledger of pending) {
      try {
        // Pull-API point: the sender app queries the conversation history by its own
        // context (sourceApp + contextId) rather than the engine messageId.
        const { data } = await axios.get(`${baseUrl}/exchanges/history`, {
          headers: { "x-api-key": apiKey },
          params: { sourceApp: "lis", contextId: ledger.contextId, limit: 5 },
          timeout: 10_000,
        });
        const exchange = data?.items?.[0] ?? data?.[0] ?? null;
        if (!exchange) continue;
        await this.dispatchRepo.update(
          { id: ledger.id },
          {
            exchangeId: exchange.id ?? ledger.exchangeId,
            status:
              exchange.status === "DELIVERED"
                ? ("SENT" as const)
                : ledger.status,
            failureReason:
              exchange.status === "FAILED"
                ? `Exchange ${exchange.id} failed`
                : ledger.failureReason,
          },
        );
      } catch (error: any) {
        this.logger.warn(
          `[notify:sync] exchange lookup failed contextId=${ledger.contextId}: ${error?.message}`,
        );
      }
    }
  }

  /** Queue: retry failed dispatches up to 3 attempts. */
  async retryFailed(limit = 20): Promise<void> {
    const failed = await this.dispatchRepo.find({
      where: [{ status: "FAILED" as const }],
      take: limit,
    });
    for (const ledger of failed) {
      if ((ledger.attempts ?? 0) >= 3) continue;
      await this.dispatchRepo.update(
        { id: ledger.id },
        { status: "PENDING", failureReason: null },
      );
    }
  }

  /** Idempotency: true when a dispatch already exists for this entity+event. */
  async hasDispatch(
    eventKey: string,
    relatedEntityType: string,
    relatedEntityId: string,
  ): Promise<boolean> {
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
    query: {
      eventKey?: string;
      status?: string;
      relatedEntityId?: string;
      audience?: string;
    },
    tenant?: TenantContext,
  ): Promise<{ data: NotificationDispatchEntity[]; total: number }> {
    const qb = this.dispatchRepo
      .createQueryBuilder("d")
      .where("d.deleted_at IS NULL");
    if (query.eventKey)
      qb.andWhere("d.event_key = :eventKey", { eventKey: query.eventKey });
    if (query.status)
      qb.andWhere("d.status = :status", { status: query.status });
    if (query.audience)
      qb.andWhere("d.audience = :audience", { audience: query.audience });
    if (query.relatedEntityId) {
      qb.andWhere("d.related_entity_id = :relatedEntityId", {
        relatedEntityId: query.relatedEntityId,
      });
    }
    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere("(d.organization_id = :orgId OR d.organization_id IS NULL)", {
        orgId: tenant.organizationId,
      });
      if (tenant.locationId) {
        qb.andWhere("(d.location_id = :locId OR d.location_id IS NULL)", {
          locId: tenant.locationId,
        });
      }
    }
    return qb
      .orderBy("d.created_at", "DESC")
      .take(100)
      .getManyAndCount()
      .then(([data, total]) => ({ data, total }));
  }
}
