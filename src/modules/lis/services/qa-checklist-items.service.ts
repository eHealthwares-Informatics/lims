import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QaChecklistItemEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateQaChecklistItemDto } from '../dto/qa-checklist-item.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class QaChecklistItemsService extends BaseLisService<QaChecklistItemEntity> {
  constructor(
    @InjectRepository(QaChecklistItemEntity) repo: Repository<QaChecklistItemEntity>,
  ) {
    super(repo, 'qa_checklist_items');
  }

  protected searchColumns(): string[] {
    return ['code', 'name', 'description'];
  }

  protected defaultSort(): string {
    return 'qa_checklist_items.sortOrder';
  }

  async create(payload: CreateQaChecklistItemDto, tenant?: TenantContext): Promise<any> {
    const item = await this.repo.save(
      this.repo.create({
        code: payload.code,
        name: payload.name,
        description: payload.description ?? null,
        category: payload.category ?? 'ORDER_ENTRY',
        required: payload.required ?? true,
        sortOrder: payload.sortOrder ?? 0,
        active: payload.active ?? true,
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
      }),
    );
    return this.findOne(item.id, tenant);
  }
}
