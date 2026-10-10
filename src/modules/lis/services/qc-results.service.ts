import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QcLotEntity, QcResultEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { TenantContext } from '../../../common/tenant-context';
import { CreateQcResultDto } from '../dto/qc-result.dto';
import { WestgardService } from './westgard.service';
import { QcAlertsService } from './qc-alerts.service';
import { NotificationTriggersService } from './notification-triggers.service';

@Injectable()
export class QcResultsService extends BaseLisService<QcResultEntity> {
  constructor(
    @InjectRepository(QcResultEntity) repo: Repository<QcResultEntity>,
    @InjectRepository(QcLotEntity) private readonly qcLotRepo: Repository<QcLotEntity>,
    private readonly westgard: WestgardService,
    private readonly alerts: QcAlertsService,
    private readonly notificationTriggers: NotificationTriggersService,
  ) {
    super(repo, 'qc_results');
  }

  protected relations(): string[] {
    return ['qcLot', 'testDefinition'];
  }

  protected searchColumns(): string[] {
    return ['instrument', 'technician'];
  }

  async create(payload: CreateQcResultDto, tenant?: TenantContext): Promise<any> {
    const qcLot = await this.qcLotRepo.findOne({
      where: { id: payload.qcLotId, deletedAt: null } as any,
    });
    if (!qcLot) {
      throw new BadRequestException('QC Lot not found');
    }

    const testConfig = qcLot.testConfig?.find(
      (tc) => tc.testDefinitionId === payload.testDefinitionId,
    );
    if (!testConfig) {
      throw new BadRequestException(
        `Test configuration not found for QC Lot ${payload.qcLotId} and test ${payload.testDefinitionId}`,
      );
    }

    const item = await this.repo.save(
      this.repo.create({
        qcLotId: payload.qcLotId,
        testDefinitionId: payload.testDefinitionId,
        value: payload.value,
        measuredAt: payload.measuredAt ? new Date(payload.measuredAt) : null,
        instrument: payload.instrument ?? null,
        technician: payload.technician ?? null,
        notes: payload.notes ?? null,
        inControl: true,
      }),
    );

    // Evaluate Westgard rules
    const recentResults = await this.repo.find({
      where: { qcLotId: payload.qcLotId, testDefinitionId: payload.testDefinitionId, deletedAt: null } as any,
      order: { createdAt: 'DESC' },
      take: 20,
    });
    recentResults.reverse();

    const violations = this.westgard.evaluate(
      payload.value,
      testConfig.mean,
      testConfig.sd,
      recentResults.map((r) => ({ value: r.value, id: r.id })),
    );

    if (violations.length > 0) {
      await this.repo.update(item.id, { inControl: false });

      for (const violation of violations) {
        const alert = await this.alerts.createFromViolation({
          qcResultId: item.id,
          rule: violation.rule,
          severity: violation.severity,
          description: violation.description,
        });
        // QC failed → lab alert through the conversations module (#111).
        await this.notificationTriggers.qcFailed(alert, item, tenant);
      }
    }

    return this.findOne(item.id);
  }

  async findByLot(qcLotId: string, tenant?: TenantContext): Promise<QcResultEntity[]> {
    return this.repo.find({
      where: { qcLotId, deletedAt: null } as any,
      relations: ['qcLot', 'testDefinition'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOutOfControl(tenant?: TenantContext): Promise<QcResultEntity[]> {
    return this.repo.find({
      where: { inControl: false, deletedAt: null } as any,
      relations: ['qcLot', 'testDefinition'],
      order: { createdAt: 'DESC' },
    });
  }
}
