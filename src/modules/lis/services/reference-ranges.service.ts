import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferenceRangeEntity, ReferenceRangeGender, TestDefinitionEntity, UnitOfMeasurementEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateReferenceRangeDto } from '../dto/reference-range.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class ReferenceRangesService extends BaseLisService<ReferenceRangeEntity> {
  constructor(
    @InjectRepository(ReferenceRangeEntity) repo: Repository<ReferenceRangeEntity>,
    @InjectRepository(TestDefinitionEntity) private readonly testDefRepo: Repository<TestDefinitionEntity>,
    @InjectRepository(UnitOfMeasurementEntity) private readonly uomRepo: Repository<UnitOfMeasurementEntity>,
  ) {
    super(repo, 'reference_ranges');
  }

  protected searchColumns(): string[] {
    return ['gender'];
  }

  protected relations(): string[] {
    return ['test', 'unit'];
  }

  protected serialize(item: ReferenceRangeEntity): any {
    return { ...item, testId: item.test?.id, unitId: item.unit?.id };
  }

  async create(payload: CreateReferenceRangeDto, tenant?: TenantContext): Promise<any> {
    if (+payload.minAge > +payload.maxAge || +payload.lowValue > +payload.highValue) {
      throw new BadRequestException('Invalid range bounds');
    }
    const test = await this.testDefRepo.findOneBy({ id: payload.testId });
    if (!test) {
      throw new BadRequestException('Test definition not found');
    }
    const overlap = await this.repo
      .createQueryBuilder('range')
      .where('range.test_definition_id = :testId', { testId: payload.testId })
      .andWhere('range.gender = :gender', { gender: payload.gender })
      .andWhere('range.deleted_at IS NULL')
      .andWhere('range.min_age <= :maxAge AND range.max_age >= :minAge', { minAge: payload.minAge, maxAge: payload.maxAge })
      .getOne();
    if (overlap) {
      throw new BadRequestException('Reference range overlaps an existing range');
    }
    const unit = payload.unitId ? await this.uomRepo.findOneBy({ id: payload.unitId }) : null;
    const item = await this.repo.save(
      this.repo.create({
        test,
        gender: payload.gender,
        minAge: payload.minAge,
        maxAge: payload.maxAge,
        lowValue: String(payload.lowValue),
        highValue: String(payload.highValue),
        unit,
        active: payload.active ?? true,
        operator: payload.operator,
        criticalLow: payload.criticalLow === undefined ? null : String(payload.criticalLow),
        criticalHigh: payload.criticalHigh === undefined ? null : String(payload.criticalHigh),
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
      }),
    );
    return this.findOne(item.id);
  }

  async validateCoverage(testId: string, tenant?: TenantContext) {
    const qb = this.repo.createQueryBuilder('range')
      .where('range.test_definition_id = :testId', { testId })
      .andWhere('range.deleted_at IS NULL');

    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere('(range.organization_id = :orgId OR range.organization_id IS NULL)', { orgId: tenant.organizationId });
      if (tenant.locationId) {
        qb.andWhere('(range.location_id = :locId OR range.location_id IS NULL)', { locId: tenant.locationId });
      }
    }

    const ranges = await qb
      .leftJoinAndSelect('range.test', 'test')
      .orderBy('range.gender', 'ASC')
      .addOrderBy('range.min_age', 'ASC')
      .getMany();
    const issues: Array<{ type: 'OVERLAP' | 'UNCOVERED'; gender: ReferenceRangeGender; message: string }> = [];
    for (const gender of Object.values(ReferenceRangeGender)) {
      const genderRanges = ranges.filter((r) => r.gender === gender);
      if (genderRanges.length < 2) continue;
      for (let i = 1; i < genderRanges.length; i++) {
        const prev = genderRanges[i - 1];
        const curr = genderRanges[i];
        if (curr.minAge <= prev.maxAge) {
          issues.push({ type: 'OVERLAP', gender, message: `${curr.minAge}-${curr.maxAge} overlaps ${prev.minAge}-${prev.maxAge}` });
        }
        if (curr.minAge > prev.maxAge + 1) {
          issues.push({ type: 'UNCOVERED', gender, message: `${prev.maxAge + 1}-${curr.minAge - 1} is uncovered` });
        }
      }
    }
    return { ok: issues.length === 0, issues };
  }
}
