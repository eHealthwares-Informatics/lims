import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MethodEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { CreateMethodDto } from '../dto/method.dto';

@Injectable()
export class MethodsService extends BaseLisService<MethodEntity> {
  constructor(
    @InjectRepository(MethodEntity) repo: Repository<MethodEntity>,
    private readonly codes: CodeGeneratorService,
  ) {
    super(repo, 'methods');
  }

  protected searchColumns(): string[] {
    return ['name', 'code'];
  }

  async create(payload: CreateMethodDto): Promise<any> {
    const code = payload.code ?? this.codes.generate('methods', payload.name ?? '');
    const duplicate = await this.repo.findOne({ where: { code, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Code already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        code,
        name: payload.name,
        description: payload.description ?? null,
        active: payload.active ?? true,
      }),
    );
    return this.findOne(item.id);
  }
}
