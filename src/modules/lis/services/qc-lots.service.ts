import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QcLotEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateQcLotDto } from '../dto/qc-lot.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class QcLotsService extends BaseLisService<QcLotEntity> {
  constructor(
    @InjectRepository(QcLotEntity) repo: Repository<QcLotEntity>,
  ) {
    super(repo, 'qc_lots');
  }

  protected searchColumns(): string[] {
    return ['controlName', 'lotNumber'];
  }

  async create(payload: CreateQcLotDto, tenant?: TenantContext): Promise<any> {
    const item = await this.repo.save(
      this.repo.create({
        controlName: payload.controlName,
        lotNumber: payload.lotNumber,
        expiryDate: payload.expiryDate ?? null,
        manufacturer: payload.manufacturer ?? null,
        active: payload.active ?? true,
        notes: payload.notes ?? null,
        testConfig: payload.testConfig ?? null,
      }),
    );
    return this.findOne(item.id);
  }
}
