import { Injectable } from '@nestjs/common';
import { ResultsService } from './results.service';
import {
  TatPriority,
  TatSummary,
  computeResultTat,
  resolvePriorityCode,
} from './tat-calculator';
import { TenantContext } from '../../../common/tenant-context';

export interface TatReportRow {
  resultId: string;
  orderItemId: string | null;
  orderNumber: string | null;
  status: string | null;
  value: string | null;
  tat: TatSummary;
}

export interface TatReport {
  summary: {
    total: number;
    released: number;
    awaitingRelease: number;
    withinTarget: number;
    breached: number;
    noTarget: number;
    averageMinutes: number | null;
  };
  data: TatReportRow[];
}

@Injectable()
export class TatService {
  constructor(private readonly results: ResultsService) {}

  /** TAT evaluation for a single result (order entry → result release). */
  async getResultTat(resultId: string, tenant?: TenantContext): Promise<TatReportRow> {
    const result = await this.results.findOne(resultId, tenant);
    return this.toRow(result);
  }

  /**
   * TAT report across results: per-result actual vs. target plus aggregate counts.
   * Only results carrying a computed TAT are returned (rows always include the
   * resolved target, even when no release timestamp exists yet).
   */
  async report(tenant?: TenantContext, limit = 200): Promise<TatReport> {
    const { data } = await this.results.list({ limit: String(limit) } as any, tenant);
    const rows = (data ?? []).map((result) => this.toRow(result));

    const released = rows.filter((row) => row.tat.actualMinutes !== null);
    const breached = rows.filter((row) => row.tat.breached);
    const withinTarget = rows.filter(
      (row) => row.tat.actualMinutes !== null && row.tat.targetMinutes !== null && !row.tat.breached,
    );
    const withTargets = rows.filter((row) => row.tat.targetMinutes !== null);
    const minutes = released
      .map((row) => row.tat.actualMinutes as number)
      .sort((a, b) => a - b);

    return {
      summary: {
        total: rows.length,
        released: released.length,
        awaitingRelease: rows.length - released.length,
        withinTarget: withinTarget.length,
        breached: breached.length,
        noTarget: rows.length - withTargets.length,
        averageMinutes: minutes.length
          ? Math.round(minutes.reduce((sum, m) => sum + m, 0) / minutes.length)
          : null,
      },
      data: rows,
    };
  }

  private toRow(result: any): TatReportRow {
    const orderItem = result.orderItem ?? {};
    const order = orderItem.order ?? {};
    return {
      resultId: result.id,
      orderItemId: orderItem.id ?? result.orderItemId ?? null,
      orderNumber: order.orderNumber ?? null,
      status: result.status ?? null,
      value: result.value ?? null,
      tat: computeResultTat(result),
    };
  }
}

export { TatPriority };
