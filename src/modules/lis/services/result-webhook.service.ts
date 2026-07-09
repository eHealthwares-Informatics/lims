import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull } from 'typeorm';
import { ResultEntity } from '../entities';

@Injectable()
export class ResultWebhookService {
  private readonly logger = new Logger(ResultWebhookService.name);
  private readonly webhookUrl: string;
  private readonly http: typeof import('http') | typeof import('https');

  constructor(
    @InjectRepository(ResultEntity) private readonly resultRepo: Repository<ResultEntity>,
    config: ConfigService,
  ) {
    this.webhookUrl = config.get<string>('INTEROP_SWITCH_WEBHOOK_URL', '');
    this.http = this.webhookUrl.startsWith('https') ? require('https') : require('http');
  }

  @Cron('*/2 * * * *')
  async sendUnacknowledgedResults() {
    if (!this.webhookUrl) {
      return;
    }

    const pending = await this.resultRepo.find({
      where: [
        { acknowledgedAt: IsNull() },
      ],
      relations: [
        'orderItem',
        'orderItem.testDefinition',
        'orderItem.order',
        'unit',
        'referenceRange',
      ],
      take: 50,
    });

    if (!pending.length) {
      return;
    }

    const payload = {
      results: pending.map((r) => ({
        id: r.id,
        value: r.value,
        unitCode: r.unit?.code ?? null,
        unitName: r.unit?.name ?? null,
        referenceRangeLow: r.referenceRange?.lowValue ?? null,
        referenceRangeHigh: r.referenceRange?.highValue ?? null,
        enteredDate: r.enteredDate,
        validatedDate: r.validatedDate,
        notes: r.notes,
        orderItem: {
          id: r.orderItem?.id,
          testDefinitionCode: r.orderItem?.testDefinition?.code ?? null,
          testDefinitionName: r.orderItem?.testDefinition?.name ?? null,
        },
        order: {
          id: r.orderItem?.order?.id,
          orderNumber: r.orderItem?.order?.orderNumber ?? null,
        },
        patient: {
          patientId: r.orderItem?.order?.patientId ?? null,
          patientName: r.orderItem?.order?.patientName ?? null,
        },
      })),
    };

    try {
      const url = new URL(this.webhookUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      };

      return new Promise<void>((resolve) => {
        const req = this.http.request(options, (res: any) => {
          let body = '';
          res.on('data', (chunk: string) => { body += chunk; });
          res.on('end', async () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              const ids = pending.map((r) => r.id);
              await this.resultRepo.update(
                { id: ids as any },
                { acknowledgedAt: new Date().toISOString() as any },
              );
              this.logger.log(`Acknowledged ${ids.length} results to switch`);
            } else {
              this.logger.warn(`Switch returned ${res.statusCode} for ${pending.length} results`);
            }
            resolve();
          });
        });
        req.on('error', (err: Error) => {
          this.logger.error(`Failed to send results to switch: ${err.message}`);
          resolve();
        });
        req.on('timeout', () => {
          req.destroy();
          this.logger.warn('Timeout sending results to switch');
          resolve();
        });
        req.write(JSON.stringify(payload));
        req.end();
      });
    } catch (err: any) {
      this.logger.error(`Error sending results to switch: ${err.message}`);
    }
  }
}
