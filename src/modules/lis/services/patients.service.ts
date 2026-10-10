import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientEntity } from '../entities';
import { BaseLisService } from './base-lis.service';
import { CreatePatientDto } from '../dto/patient.dto';
import { TenantContext } from '../../../common/tenant-context';

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

  protected serialize(item: PatientEntity): any {
    return {
      id: item.id,
      patientId: item.patientId,
      firstName: item.firstName,
      lastName: item.lastName,
      dateOfBirth: item.dateOfBirth,
      gender: item.gender,
      phone: item.phone,
      email: item.email,
      address: item.address,
      organizationId: item.organizationId,
      locationId: item.locationId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async create(payload: CreatePatientDto, tenant?: TenantContext): Promise<any> {
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
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
      }),
    );
    return this.findOne(item.id);
  }

  async update(id: string, payload: Record<string, unknown>, tenant?: TenantContext): Promise<any> {
    const item = await this.findOne(id, tenant);
    if (payload.patientId !== undefined) item.patientId = payload.patientId as string;
    if (payload.firstName !== undefined) item.firstName = payload.firstName as string;
    if (payload.lastName !== undefined) item.lastName = payload.lastName as string;
    if (payload.dateOfBirth !== undefined) item.dateOfBirth = payload.dateOfBirth as string | null;
    if (payload.gender !== undefined) item.gender = payload.gender as string | null;
    if (payload.phone !== undefined) item.phone = payload.phone as string | null;
    if (payload.email !== undefined) item.email = payload.email as string | null;
    if (payload.address !== undefined) item.address = payload.address as string | null;
    await this.repo.save(item);
    return this.findOne(id, tenant);
  }

  async findByPatientId(patientId: string): Promise<PatientEntity | null> {
    return this.repo.findOne({
      where: { patientId, deletedAt: null } as any,
      order: { createdAt: 'DESC' },
    });
  }

  async replace(id: string, payload: CreatePatientDto, tenant?: TenantContext): Promise<any> {
    const item = await this.findOne(id, tenant);
    const saved = await this.repo.save({
      ...item,
      patientId: payload.patientId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      dateOfBirth: payload.dateOfBirth ?? null,
      gender: payload.gender ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      address: payload.address ?? null,
    });
    return this.findOne(saved.id, tenant);
  }
}