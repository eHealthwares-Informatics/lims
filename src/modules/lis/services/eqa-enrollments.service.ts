import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EqaEnrollmentEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreateEqaEnrollmentDto } from '../dto/eqa-enrollment.dto';

@Injectable()
export class EqaEnrollmentsService extends BaseLisService<EqaEnrollmentEntity> {
  constructor(
    @InjectRepository(EqaEnrollmentEntity) repo: Repository<EqaEnrollmentEntity>,
  ) {
    super(repo, 'eqa_enrollments');
  }

  protected relations(): string[] {
    return ['program', 'testDefinition'];
  }

  protected searchColumns(): string[] {
    return ['roundLabel', 'status'];
  }

  async create(payload: CreateEqaEnrollmentDto): Promise<any> {
    const item = await this.repo.save(
      this.repo.create({
        programId: payload.programId,
        testDefinitionId: payload.testDefinitionId,
        roundLabel: payload.roundLabel,
        status: 'ENROLLED',
        enrolledAt: payload.enrolledAt ? new Date(payload.enrolledAt) : new Date(),
        notes: payload.notes ?? null,
      }),
    );
    return this.findOne(item.id);
  }

  async findByProgram(programId: string): Promise<EqaEnrollmentEntity[]> {
    return this.repo.find({
      where: { programId, deletedAt: null } as any,
      relations: ['program', 'testDefinition'],
      order: { enrolledAt: 'DESC' },
    });
  }

  async findByStatus(status: string): Promise<EqaEnrollmentEntity[]> {
    return this.repo.find({
      where: { status: status as any, deletedAt: null } as any,
      relations: ['program', 'testDefinition'],
      order: { enrolledAt: 'DESC' },
    });
  }

  async submitResults(id: string): Promise<any> {
    const item = await this.repo.findOne({ where: { id, deletedAt: null } as any });
    if (!item) throw new Error('Enrollment not found');
    item.status = 'RESULTS_SUBMITTED';
    item.submittedAt = new Date();
    await this.repo.save(item);
    return this.findOne(id);
  }

  async markEvaluated(id: string): Promise<any> {
    const item = await this.repo.findOne({ where: { id, deletedAt: null } as any });
    if (!item) throw new Error('Enrollment not found');
    item.status = 'EVALUATED';
    item.evaluatedAt = new Date();
    await this.repo.save(item);
    return this.findOne(id);
  }
}