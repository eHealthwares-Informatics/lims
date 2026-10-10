import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { OrderEntity } from '../entities';
import { NotificationTriggersService } from './notification-triggers.service';

/**
 * Scheduled laboratory alert scans (#111):
 * - Sample delayed / TAT breach for orders open past the SLA window.
 *
 * Analyzer-offline / reagent-low depend on analyzer integration (Phase 4)
 * and have no data source yet; the trigger plumbing exists via
 * NotificationTriggersService for when those events arrive.
 */
@Injectable()
export class LabAlertScheduler {
  private readonly logger = new Logger(LabAlertScheduler.name);

  private static readonly OPEN_ORDER_STATUSES = ['ENTERED', 'IN_PROGRESS'];

  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    private readonly triggers: NotificationTriggersService,
    private readonly config: ConfigService,
  ) {}

  private get slaHours(): number {
    return Number(this.config.get<string>('LIS_ORDER_SLA_HOURS', '48')) || 48;
  }

  @Cron('*/30 * * * *')
  async scanTatBreaches(): Promise<void> {
    try {
      const open = await this.orderRepo.find({
        where: {
          status: In(LabAlertScheduler.OPEN_ORDER_STATUSES),
          deletedAt: IsNull(),
        },
        take: 200,
      });

      const cutoffHours = this.slaHours;
      for (const order of open) {
        const startStr = order.receivedDate ?? order.requestedDate ?? order.createdAt?.toISOString();
        if (!startStr) continue;
        const startMs = new Date(startStr).getTime();
        if (Number.isNaN(startMs)) continue;
        const hoursElapsed = Math.floor((Date.now() - startMs) / 3_600_000);
        if (hoursElapsed < cutoffHours) continue;

        // Idempotency: only notify once per order (already-breached dispatches
        // are on the ledger; skip if one exists for this order).
        const alreadyNotified = await this.triggers.hasDispatch(
          'ORDER_TAT_BREACH',
          'Order',
          order.id,
        );
        if (alreadyNotified) continue;

        await this.triggers.orderTatBreach(order, hoursElapsed, cutoffHours);
        this.logger.log(`[tat-breach] notified for order ${order.orderNumber} (${hoursElapsed}h)`);
      }
    } catch (error: any) {
      this.logger.error(`TAT scan failed: ${error?.message ?? error}`);
    }
  }
}
