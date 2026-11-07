import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

type DispatchChannel = "sms" | "whatsapp" | "email";

/**
 * Dispatch seam to the conversations notification engine.
 *
 * Notifications are dispatched through `POST /notification-dispatch/payload`
 * (the same producer contract HealthStack/EMR/RxSoft use): the LIS renders the
 * message, supplies an event key + recipients, and conversation resolves the
 * transport channels and records the delivery ledger.
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

  private notificationChannel(type: string): DispatchChannel {
    switch (String(type ?? "").toUpperCase()) {
      case "EMAIL":
        return "email";
      case "WHATSAPP":
        return "whatsapp";
      case "SMS":
      default:
        return "sms";
    }
  }

  /**
   * Sends a notification through the conversation notification engine.
   * Returns the conversation delivery id (when a channel accepted it).
   */
  async send(params: {
    organizationId?: string | null;
    channelType: string;
    phone?: string | null;
    email?: string | null;
    title: string;
    message: string;
    /** Stable id used as the exchange contextId for dedupe. */
    contextId: string;
    sourceApp: string;
    eventType: string;
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
  }): Promise<{ ok: boolean; exchangeId?: string | null; error?: string }> {
    const channel = this.notificationChannel(params.channelType);
    const recipients = {
      phone: channel === "email" ? undefined : (params.phone ?? undefined),
      email: channel === "email" ? (params.email ?? undefined) : undefined,
    };

    if (!recipients.phone && !recipients.email) {
      return { ok: false, error: `No recipient for ${channel}` };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/notification-dispatch/payload`,
        {
          organizationId: params.organizationId ?? null,
          eventKey: params.eventType,
          channels: [channel],
          recipients,
          subject: params.title,
          message: params.message,
          context: {
            source: "lis-notification",
            sourceApp: params.sourceApp,
            eventType: params.eventType,
            contextId: params.contextId,
            relatedEntityType: params.relatedEntityType ?? null,
            relatedEntityId: params.relatedEntityId ?? null,
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
        `Conversation dispatch failed channel=${channel} to=${recipients.phone || recipients.email}: ${JSON.stringify(detail)}`,
      );
      return { ok: false, error: JSON.stringify(detail) };
    }
  }
}
