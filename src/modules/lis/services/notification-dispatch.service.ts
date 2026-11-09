import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

/**
 * Dispatch seam to the conversations notification engine.
 *
 * The LIS sends an event key plus context. Conversation resolves the
 * notification template, channels, recipients and delivery ledger — the sender
 * does not render a message or select a channel.
 *
 * The LIS keeps its own dispatch ledger (`NotificationDispatchEntity`) for
 * reporting; `exchangeId` holds the conversation delivery id when present.
 */
@Injectable()
export class ConversationDispatchService {
  private readonly logger = new Logger(ConversationDispatchService.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.get<string>(
      "CONVERSATION_API_URL",
      "http://localhost:8090/api",
    );
  }

  private get internalApiKey(): string {
    return this.config.get<string>("INTEROP_API_KEY", "lis-interop-key-dev");
  }

  /** Map LIS trigger keys onto the conversation notification event keys. */
  private eventKey(type: string): string {
    switch (String(type ?? "").toUpperCase()) {
      case "RESULT_READY":
      case "RESULT_AMENDED":
        return "final_result";
      case "SAMPLE_RECEIVED":
        return "sample_received";
      case "CRITICAL_RESULT":
        return "critical_result";
      case "PAYMENT_REMINDER":
        return "payment_reminder";
      case "ORDER_TAT_BREACH":
        return "order_tat_breach";
      case "QC_FAILED":
        return "qc_failed";
      case "TEST_ORDER_RECEIVED":
        return "test_order_received";
      default:
        return String(type ?? "").toLowerCase();
    }
  }

  /**
   * Sends a notification event through the conversation engine.
   * Returns the conversation delivery id when a channel accepted it.
   */
  async send(params: {
    organizationId?: string | null;
    phone?: string | null;
    email?: string | null;
    title: string;
    message: string;
    /** Template variables forwarded to conversation. */
    context?: Record<string, unknown>;
    /** Stable id used as the exchange contextId for dedupe. */
    contextId: string;
    sourceApp: string;
    eventType: string;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
  }): Promise<{ ok: boolean; exchangeId?: string | null; deliveries: string[]; error?: string }> {
    const recipients = {
      phone: params.phone ?? undefined,
      email: params.email ?? undefined,
    };

    if (!recipients.phone && !recipients.email) {
      return { ok: false, deliveries: [], error: "No recipient for notification" };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/notification-dispatch/send`,
        {
          // Normalised contract: eventKey + organizationId + recipients + context.
          organizationId: params.organizationId ?? null,
          eventKey: this.eventKey(params.eventType),
          recipients,
          context: {
            source: "lis-notification",
            sourceApp: params.sourceApp,
            eventType: params.eventType,
            contextId: params.contextId,
            title: params.title,
            message: params.message,
            relatedEntityType: params.relatedEntityType ?? null,
            relatedEntityId: params.relatedEntityId ?? null,
            ...(params.context ?? {}),
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.internalApiKey,
          },
          timeout: 30_000,
        },
      );

      const data = response.data ?? {};
      const sent = Number(data?.sent ?? 0);
      const failed = Number(data?.failed ?? 0);
      const deliveries = Array.isArray(data?.deliveries) ? data.deliveries : [];

      return {
        ok: sent > 0,
        exchangeId: deliveries[0] ?? null,
        deliveries,
        error:
          sent > 0
            ? undefined
            : failed > 0
              ? "Conversation notification dispatch failed"
              : "No conversation notification channel available",
      };
    } catch (error: any) {
      const detail = error?.response?.data ?? error?.message ?? error;
      this.logger.error(
        `Conversation dispatch failed event=${params.eventType} to=${recipients.phone || recipients.email}: ${JSON.stringify(detail)}`,
      );
      return { ok: false, deliveries: [], error: JSON.stringify(detail) };
    }
  }
}
