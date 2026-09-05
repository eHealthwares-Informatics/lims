import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ReportPdfService } from './report-pdf.service';

export type ReportChannel = 'whatsapp' | 'sms' | 'email';

export interface SendReportOptions {
  via: ReportChannel;
  phone?: string;
  email?: string;
  message?: string;
}

@Injectable()
export class ReportDeliveryService {
  private readonly logger = new Logger(ReportDeliveryService.name);

  constructor(
    private readonly pdfService: ReportPdfService,
    private readonly config: ConfigService,
  ) {}

  private conversationBaseUrl(): string {
    return this.config.get<string>('CONVERSATION_API_URL', 'http://localhost:8090/api');
  }

  /**
   * Generates the PDF report and hands it to the conversation engine's
   * `send-media` channel endpoint, which dispatches to the configured
   * WhatsApp / SMS / Email provider.
   */
  async send(orderId: string, options: SendReportOptions): Promise<any> {
    const { via, phone, email, message } = options;
    const { buffer, filename } = await this.pdfService.generatePdf(orderId);

    const subject =
      via === 'email'
        ? `Laboratory Report`
        : 'Laboratory Report';

    const body = message ?? 'Please find attached your laboratory report.';

    const form = new FormData();
    form.append('code', via);
    if (phone) form.append('phone', phone);
    if (email) form.append('email', email);
    form.append('documentType', 'document');
    form.append('message', body);
    form.append('title', subject);
    form.append('fileName', filename);
    form.append('context', JSON.stringify({ source: 'lis-report', documentType: 'document', fileName: filename }));

    const blob = new Blob([new Uint8Array(buffer)], {
      type: 'application/pdf',
    });
    form.append('file', blob, filename);

    const url = `${this.conversationBaseUrl()}/channels/send-media`;
    this.logger.log(`Sending report ${filename} via ${via} to ${phone || email}`);

    try {
      const response = await axios.post(url, form, {
        headers: { accept: '*/*', ...(form as any).getHeaders?.() },
        timeout: 60_000,
      });
      return { via, success: true, filename, response: response.data };
    } catch (error: any) {
      const detail = error?.response?.data ?? error?.message ?? error;
      this.logger.error(`Report delivery via ${via} failed: ${JSON.stringify(detail)}`);
      throw error;
    }
  }
}
