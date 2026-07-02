import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreatePatientDto } from '../dto/patient.dto';

@Injectable()
export class PatientsService extends BaseLisService<PatientEntity> {
  constructor(
    @InjectRepository(PatientEntity) repo: Repository<PatientEntity>,
  ) {
    super(repo, 'patients');
  }

  protected searchColumns(): string[] {
    return ['patientId', 'firstName', 'lastName'];
  }

  async create(payload: CreatePatientDto): Promise<any> {
    const duplicate = await this.repo.findOne({ where: { patientId: payload.patientId, deletedAt: null } as any });
    if (duplicate) {
      throw new BadRequestException('Patient ID already exists');
    }
    const item = await this.repo.save(
      this.repo.create({
        patientId: payload.patientId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        dateOfBirth: payload.dateOfBirth ?? null,
        gender: payload.gender ?? null,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        address: payload.address ?? null,
      }),
    );
    return this.findOne(item.id);
  }
}
