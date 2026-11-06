import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export type PrintResourceInput = {
  organizationId: string;
  resourceType: string;
  resourceId: string;
  printTemplateId?: string | null;
  format?: string;
  fileName?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
};

export type PrintArtifact = {
  buffer: Buffer;
  fileName?: string;
  mimeType?: string;
  cloudinaryUrl?: string | null;
  s3Url?: string | null;
  metadata?: Record<string, unknown>;
};

export type CachedPrint = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  cacheHit: boolean;
  record: any;
};

/**
 * Storage-agnostic print client for lims. Delegates to the conversation
 * engine's print-io service which handles local cache, Cloudinary, and S3
 * fallback. The caller (report-pdf.service) generates the PDF locally via
 * puppeteer, then stores the artifact in conversation.
 *
 * Caller just calls getOrGenerate and gets back a buffer or file URL.
 */
@Injectable()
export class PrintClientService {
  private readonly logger = new Logger(PrintClientService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private baseUrl(): string {
    return (
      this.config.get<string>('CONVERSATION_API_URL', 'http://localhost:8090/api') +
      '/prints'
    );
  }

  private apiKey(): string {
    return this.config.get<string>('INTEROP_API_KEY', 'lims-interop-key-dev');
  }

  /**
   * Get or generate a print. Ensures a record exists in conversation, then the
   * caller generates the artifact locally and stores it via storeArtifact.
   * Returns a cached print (buffer, fileName, mimeType, cacheHit, record).
   */
  async getOrGenerate(
    input: PrintResourceInput,
    generate: () => Promise<PrintArtifact>,
  ): Promise<CachedPrint> {
    // Ensure a record exists in conversation.
    const response = await firstValueFrom(
      this.http.post<{ record: any }>(
        `${this.baseUrl()}`,
        {
          organizationId: input.organizationId,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          printTemplateId: input.printTemplateId,
          format: input.format,
          fileName: input.fileName,
          mimeType: input.mimeType,
          metadata: input.metadata,
        },
        { headers: { 'x-api-key': this.apiKey() } },
      ),
    );
    const record = response.data?.record ?? {};

    // If already ready, try to return the cached buffer.
    if (record.status === 'ready') {
      const buffer = await this.downloadRecord(record);
      if (buffer) {
        return {
          buffer,
          fileName: record.fileName,
          mimeType: record.mimeType,
          cacheHit: true,
          record,
        };
      }
    }

    // Generate locally (puppeteer in lims).
    const artifact = await generate();

    // Store the artifact in conversation.
    await firstValueFrom(
      this.http.post(
        `${this.baseUrl()}/${record.id}/artifact`,
        {
          buffer: artifact.buffer.toString('base64'),
          fileName: artifact.fileName,
          mimeType: artifact.mimeType,
          cloudinaryUrl: artifact.cloudinaryUrl,
          s3Url: artifact.s3Url,
          metadata: artifact.metadata,
        },
        { headers: { 'x-api-key': this.apiKey() } },
      ),
    );

    return {
      buffer: artifact.buffer,
      fileName: artifact.fileName ?? record.fileName,
      mimeType: artifact.mimeType ?? record.mimeType,
      cacheHit: false,
      record,
    };
  }

  async list(
    organizationId: string,
    query: {
      resourceType?: string;
      resourceId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const response = await firstValueFrom(
      this.http.get<{ data: any[]; total: number; page: number; limit: number }>(
        `${this.baseUrl()}`,
        {
          params: {
            organizationId,
            resourceType: query.resourceType,
            resourceId: query.resourceId,
            page: query.page,
            limit: query.limit,
          },
          headers: { 'x-api-key': this.apiKey() },
        },
      ),
    );
    return response.data.data;
  }

  async findById(id: string, organizationId: string): Promise<any> {
    const response = await firstValueFrom(
      this.http.get<{ record: any }>(
        `${this.baseUrl()}/${id}`,
        {
          params: { organizationId },
          headers: { 'x-api-key': this.apiKey() },
        },
      ),
    );
    return response.data.record;
  }

  async uploadNow(
    id: string,
    organizationId: string,
    target: 'cloudinary' | 's3' | 'both' = 'both',
  ): Promise<any> {
    const { data } = await firstValueFrom(
      this.http.post(
        `${this.baseUrl()}/${id}/upload/${target === 'both' ? '' : target}`,
        {},
        { headers: { 'x-api-key': this.apiKey() } },
      ),
    );
    return data;
  }

  /** Download a record's buffer from remote URL. */
  private async downloadRecord(record: any): Promise<Buffer | null> {
    for (const remote of [record.cloudinaryUrl, record.s3Url]) {
      if (!remote) continue;
      try {
        const { data } = await firstValueFrom(
          this.http.get(remote, {
            responseType: 'arraybuffer',
            headers: { 'x-api-key': this.apiKey() },
          }),
        );
        return Buffer.from(data);
      } catch {
        // Try next remote.
      }
    }
    return null;
  }
}
