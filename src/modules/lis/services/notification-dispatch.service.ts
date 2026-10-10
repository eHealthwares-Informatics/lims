import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

/**
 * Dispatch seam to the conversations module. Notifications are conversation
 * messages: they go out through the conversation engine's channel senders
 * (SMS / WhatsApp / Email), which log every attempt as a persisted `Exchange`
 * with delivery status.
 *
 * The LIS keeps its own dispatch ledger (NotificationDispatchEntity) and
 * links each row to the conversation exchange via `exchangeId` / `contextId`.
 */
@Injectable()
export class ConversationDispatchService {
  private readonly logger = new Logger(ConversationDispatchService.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.get<string>('CONVERSATION_API_URL', 'http://localhost:8090/api');
  }

  private get internalApiKey(): string {
    return this.config.get<string>('INTEROP_API_KEY', 'lis-interop-key-dev');
  }

  /** Default conversation-engine channel codes per channel type. */
  private defaultChannelCode(type: string): string {
    switch (type) {
      case 'WHATSAPP':
        return 'LIS_WHATSAPP';
      case 'EMAIL':
        return 'LIS_EMAIL';
      case 'SMS':
      default:
        return 'LIS_SMS';
    }
  }

  /**
   * Sends a notification conversation message on one channel.
   * Returns the conversation exchange id (or null when dispatch failed).
   */
  async send(params: {
    channelType: string;
    channelCodeOverride?: string | null;
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
    const channelCode =
      params.channelCodeOverride || this.defaultChannelCode(params.channelType);

    const form = new FormData();
    form.append('code', channelCode);
    if (params.phone) form.append('phone', params.phone);
    if (params.email) form.append('email', params.email);
    form.append('title', params.title);
    form.append('message', params.message);
    form.append('context', JSON.stringify({
      source: 'lis-notification',
      sourceApp: params.sourceApp,
      eventType: params.eventType,
      contextId: params.contextId,
      relatedEntityType: params.relatedEntityType ?? null,
      relatedEntityId: params.relatedEntityId ?? null,
    }));

    try {
      const response = await axios.post(
        `${this.baseUrl}/channels/send-message`,
        form,
        {
          headers: { 'x-api-key': this.internalApiKey, ...(form as any).getHeaders?.() },
          timeout: 30_000,
        },
      );
      const data = response.data ?? {};
      return {
        ok: true,
        exchangeId: data?.id ?? data?.exchangeId ?? null,
      };
    } catch (error: any) {
      const detail = error?.response?.data ?? error?.message ?? error;
      this.logger.error(
        `Conversation dispatch failed channel=${channelCode} to=${params.phone || params.email}: ${JSON.stringify(detail)}`,
      );
      return { ok: false, error: JSON.stringify(detail) };
    }
  }
}
