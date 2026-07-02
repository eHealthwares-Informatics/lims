import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResultEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateResultDto } from '../dto/result.dto';

@Injectable()
export class ResultsService extends BaseLisService<ResultEntity> {
  constructor(
    @InjectRepository(ResultEntity) repo: Repository<ResultEntity>,
  ) {
    super(repo, 'results');
  }

  protected searchColumns(): string[] {
    return ['orderItemId', 'value'];
  }

  protected relations(): string[] {
    return ['orderItem', 'unit', 'referenceRange'];
  }

  async create(payload: CreateResultDto): Promise<any> {
    const item = await this.repo.save(
      this.repo.create({
        orderItemId: payload.orderItemId,
        value: payload.value ?? null,
        unitId: payload.unitId ?? null,
        referenceRangeId: payload.referenceRangeId ?? null,
        enteredById: payload.enteredById ?? null,
        enteredDate: payload.enteredDate ?? new Date().toISOString().split('T')[0],
        validatedById: payload.validatedById ?? null,
        validatedDate: payload.validatedDate ?? null,
        notes: payload.notes ?? null,
      }),
    );
    return this.findOne(item.id);
  }
}
