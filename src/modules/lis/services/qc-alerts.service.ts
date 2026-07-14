import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QcAlertEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { TenantContext } from '../../../common/tenant-context';
import type { WestgardRule, AlertSeverity } from '../entities/qc-alert.entity';

export interface ViolationInput {
  qcResultId: string;
  rule: WestgardRule;
  severity: AlertSeverity;
  description: string;
}

@Injectable()
export class QcAlertsService extends BaseLisService<QcAlertEntity> {
  constructor(
    @InjectRepository(QcAlertEntity) repo: Repository<QcAlertEntity>,
  ) {
    super(repo, 'qc_alerts');
  }

  protected relations(): string[] {
    return ['qcResult'];
  }

  protected searchColumns(): string[] {
    return ['rule', 'severity', 'description'];
  }

  async createFromViolation(input: ViolationInput): Promise<QcAlertEntity> {
    return this.repo.save(
      this.repo.create({
        qcResultId: input.qcResultId,
        rule: input.rule,
        severity: input.severity,
        description: input.description,
        active: true,
      }),
    );
  }

  async findActive(tenant?: TenantContext): Promise<QcAlertEntity[]> {
    return this.repo.find({
      where: { active: true, deletedAt: null } as any,
      relations: ['qcResult'],
      order: { createdAt: 'DESC' },
    });
  }

  async acknowledge(id: string, by?: string, tenant?: TenantContext): Promise<any> {
    const item = await this.repo.findOne({
      where: { id, deletedAt: null } as any,
    });
    if (!item) {
      throw new Error('Alert not found');
    }
    item.active = false;
    item.acknowledgedAt = new Date();
    item.acknowledgedBy = by ?? null;
    await this.repo.save(item);
    return this.findOne(id);
  }
}
