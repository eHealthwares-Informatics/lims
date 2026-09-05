import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObservationHistoryTypeEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateObservationHistoryTypeDto } from '../dto/observation-history-type.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class ObservationHistoryTypesService extends BaseLisService<ObservationHistoryTypeEntity> {
  constructor(@InjectRepository(ObservationHistoryTypeEntity) repo: Repository<ObservationHistoryTypeEntity>) {
    super(repo, 'observation_history_types');
  }

  protected searchColumns(): string[] {
    return ['typeName', 'description'];
  }

  async create(payload: CreateObservationHistoryTypeDto, tenant?: TenantContext): Promise<any> {
    const duplicate = await this.repo.findOne({ where: { typeName: payload.typeName, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Type name already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        typeName: payload.typeName,
        description: payload.description ?? null,
      }),
    );
    return this.findOne(item.id);
  }
}
