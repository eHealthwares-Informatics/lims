import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderItemEntity, SampleEntity, TestDefinitionEntity, LoincEntity } from '../entities';
import { CodeGeneratorService } from './code-generator.service';
import { BaseLisService } from './base-lis.service';
import { StatusesService } from './statuses.service';
import { StatusHistoryService } from './status-history.service';
import { CreateOrderDto } from '../dto/order.dto';
import { TenantContext } from '../../../common/tenant-context';

@Injectable()
export class OrdersService extends BaseLisService<OrderEntity> {
  constructor(
    @InjectRepository(OrderEntity) repo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity) private readonly orderItemRepo: Repository<OrderItemEntity>,
    @InjectRepository(SampleEntity) private readonly sampleRepo: Repository<SampleEntity>,
    @InjectRepository(TestDefinitionEntity) private readonly testDefinitionRepo: Repository<TestDefinitionEntity>,
    @InjectRepository(LoincEntity) private readonly loincRepo: Repository<LoincEntity>,
    private readonly codes: CodeGeneratorService,
    private readonly statuses: StatusesService,
    private readonly statusHistory: StatusHistoryService,
  ) {
    super(repo, 'orders');
  }

  private static readonly UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  /**
   * Accepts a test definition id (uuid), a test definition code, or a LOINC
   * code and resolves it to the test definition uuid. External callers (the
   * EMR) send LOINC/test-definition codes because they never see LIS uuids.
   */
  private async resolveTestDefinitionIds(items: Array<{ testDefinitionId: string }>): Promise<string[]> {
    const ids: string[] = [];
    for (const item of items) {
      const raw = (item.testDefinitionId ?? '').trim();
      if (OrdersService.UUID_RE.test(raw)) {
        ids.push(raw);
        continue;
      }
      const byCode = await this.testDefinitionRepo.findOne({
        where: { code: raw, deletedAt: null } as any,
      });
      if (byCode) {
        ids.push(byCode.id);
        continue;
      }
      const loinc = await this.loincRepo.findOne({
        where: { code: raw, deletedAt: null } as any,
      });
      if (loinc) {
        const viaLoinc = await this.testDefinitionRepo.findOne({
          where: { loinc: { id: loinc.id }, deletedAt: null } as any,
        });
        if (viaLoinc) {
          ids.push(viaLoinc.id);
          continue;
        }
      }
      const byName = await this.testDefinitionRepo.findOne({
        where: { name: raw, deletedAt: null } as any,
      });
      if (byName) {
        ids.push(byName.id);
        continue;
      }
      throw new BadRequestException(`Unknown LIS test definition "${raw}"`);
    }
    return ids;
  }

  protected searchColumns(): string[] {
    return ['orderNumber', 'patientId', 'patientName'];
  }

  protected listFilters(query: Record<string, string>): Record<string, string> {
    return query.source ? { source: query.source } : {};
  }

  protected relations(): string[] {
    return ['priority', 'statusRef', 'items', 'items.testDefinition', 'items.sample', 'samples', 'samples.sampleType'];
  }

  protected serialize(item: OrderEntity): any {
    return {
      ...item,
      stepProgress: item.stepProgress ?? { enter: false, collect: false, label: false, qa: false },
      qaChecks: item.qaChecks ?? {},
      items: item.items?.map((oi) => ({
        id: oi.id,
        testDefinitionId: oi.testDefinitionId ?? oi.testDefinition?.id,
        testDefinition: oi.testDefinition,
        referenceCode: oi.referenceCode,
        sampleId: oi.sampleId,
        status: oi.status,
        resultValue: oi.resultValue,
        resultDate: oi.resultDate,
        notes: oi.notes,
      })) ?? [],
      samples: item.samples?.map((s) => ({
        id: s.id,
        barcode: s.barcode,
        sampleTypeId: s.sampleTypeId,
        sampleTypeName: s.sampleType?.name ?? null,
        collector: s.collector,
        collectionDate: s.collectionDate,
        receivedDate: s.receivedDate,
        collectionMethod: s.collectionMethod,
        collectionConditions: s.collectionConditions,
        quantity: s.quantity,
        notes: s.notes,
        printStatus: s.printStatus,
        printedAt: s.printedAt,
        storageLocationId: s.storageLocationId,
        storageNotes: s.storageNotes,
        rejected: s.rejected,
      })) ?? [],
    };
  }

  async create(payload: CreateOrderDto, tenant?: TenantContext): Promise<any> {
    const now = new Date();
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const source = payload.source ?? 'MANUAL';
    const orderNumber =
      source === 'emr-encounter-request' && payload.internalReference
        ? `EMRORD-${payload.internalReference.replace(/^REQ-/, '')}`
        : `ORD-${ymd}-${rand}`;
    const initialStatus = await this.statuses.findByCode('ENTERED');
    const order = await this.repo.save(
      this.repo.create({
        orderNumber,
        patientId: payload.patientId,
        internalReference: payload.internalReference ?? null,
        externalReference: payload.externalReference ?? null,
        source,
        patientName: payload.patientName,
        patientAge: payload.patientAge ?? null,
        patientGender: payload.patientGender ?? null,
        patientDateOfBirth: payload.patientDateOfBirth ?? null,
        priorityId: payload.priorityId ?? null,
        requestedDate: payload.requestedDate ?? null,
        requesterName: payload.requesterName ?? null,
        requesterPhone: payload.requesterPhone ?? null,
        diagnosis: payload.diagnosis ?? null,
        clinicalNotes: payload.clinicalNotes ?? null,
        notes: payload.notes ?? null,
        stepProgress: payload.stepProgress ?? { enter: true, collect: false, label: false, qa: false },
        qaChecks: payload.qaChecks ?? {},
        createdById:
          tenant?.userId && /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(tenant.userId)
            ? tenant.userId
            : null,
        patientNumber: payload.patientNumber ?? null,
        referenceCode: payload.referenceCode ?? payload.internalReference ?? null,
        status: 'ENTERED',
        statusId: initialStatus?.id ?? null,
        organizationId: tenant?.organizationId ?? null,
        locationId: tenant?.locationId ?? null,
      }),
    );
    const sampleIds = await this.createSamples(order, payload.samples ?? [], tenant);
    if (payload.items?.length) {
      const resolved = this.resolveSampleIds(payload.items, payload.assignments, sampleIds);
      const testDefinitionIds = await this.resolveTestDefinitionIds(payload.items);
      await this.orderItemRepo.save(
        payload.items.map((item, i) =>
          this.orderItemRepo.create({
            order,
            testDefinitionId: testDefinitionIds[i],
            referenceCode: item.referenceCode ?? null,
            sampleId: resolved[i],
            notes: item.notes ?? null,
            status: 'PENDING',
          }),
        ),
      );
    }
    if (initialStatus) {
      await this.statusHistory.record('Order', order.id, initialStatus.id, null, null, 'Order created');
    }
    return this.findOne(order.id);
  }

  async update(id: string, payload: Record<string, unknown>, tenant?: TenantContext): Promise<any> {
    const order = await this.findOne(id, tenant);
    if (payload.patientNumber !== undefined) order.patientNumber = payload.patientNumber as string | null;
    if (payload.referenceCode !== undefined) order.referenceCode = payload.referenceCode as string | null;
    if (payload.status !== undefined) order.status = payload.status as string;
    if (payload.patientName !== undefined) order.patientName = payload.patientName as string;
    if (payload.patientAge !== undefined) order.patientAge = payload.patientAge as number | null;
    if (payload.patientGender !== undefined) order.patientGender = payload.patientGender as string | null;
    if (payload.patientDateOfBirth !== undefined) order.patientDateOfBirth = payload.patientDateOfBirth as string | null;
    if (payload.internalReference !== undefined) order.internalReference = payload.internalReference as string | null;
    if (payload.externalReference !== undefined) order.externalReference = payload.externalReference as string | null;
    if (payload.collectedDate !== undefined) order.collectedDate = payload.collectedDate as string | null;
    if (payload.completedDate !== undefined) order.completedDate = payload.completedDate as string | null;
    if (payload.receivedDate !== undefined) order.receivedDate = payload.receivedDate as string | null;
    if (payload.requesterName !== undefined) order.requesterName = payload.requesterName as string | null;
    if (payload.requesterPhone !== undefined) order.requesterPhone = payload.requesterPhone as string | null;
    if (payload.diagnosis !== undefined) order.diagnosis = payload.diagnosis as string | null;
    if (payload.clinicalNotes !== undefined) order.clinicalNotes = payload.clinicalNotes as string | null;
    if (payload.stepProgress !== undefined) order.stepProgress = payload.stepProgress as { enter: boolean; collect: boolean; label: boolean; qa: boolean };
    if (payload.qaChecks !== undefined) order.qaChecks = payload.qaChecks as Record<string, boolean>;
    if (payload.createdById !== undefined) order.createdById = payload.createdById as string | null;
    if (payload.notes !== undefined) order.notes = payload.notes as string | null;
    await this.repo.save(order);

    let sampleIds: (string | null)[] = [];
    if (payload.samples !== undefined) {
      sampleIds = await this.upsertSamples(order, payload.samples as any[], tenant);
    }

    if (payload.items !== undefined) {
      const itemsPayload = payload.items as any[];
      if (sampleIds.length === 0) {
        sampleIds = (await this.sampleRepo.find({
          where: { order: { id } },
          order: { createdAt: 'ASC' },
        })).map((s) => s.id);
      }
      await this.upsertItems(order, itemsPayload, payload.assignments as any[] | undefined, sampleIds);
    }

    if (payload.assignments !== undefined && payload.items === undefined) {
      await this.applyAssignments(id, payload.assignments as any[]);
    }

    return this.findOne(id, tenant);
  }

  private async upsertSamples(order: OrderEntity, samples: any[], tenant?: TenantContext): Promise<(string | null)[]> {
    const ids: (string | null)[] = [];
    if (!samples?.length) return ids;
    const sampleStatus = await this.statuses.findByCode('COLLECTED');
    const existing = await this.sampleRepo.find({ where: { order: { id: order.id } } });
    const byBarcode = new Map(existing.map((s) => [s.barcode, s]));
    const wanted = new Set(samples.map((s) => s.barcode));
    for (const s of samples) {
      const found = byBarcode.get(s.barcode);
      const data = {
        barcode: s.barcode,
        sampleTypeId: s.sampleTypeId ?? found?.sampleTypeId ?? null,
        collector: s.collector ?? found?.collector ?? null,
        collectionDate: s.collectionDate ? new Date(s.collectionDate) : found?.collectionDate ?? null,
        receivedDate: s.receivedDate ? new Date(s.receivedDate) : found?.receivedDate ?? null,
        collectionMethod: s.collectionMethod ?? found?.collectionMethod ?? null,
        collectionConditions: s.collectionConditions ?? found?.collectionConditions ?? null,
        quantity: s.quantity ?? found?.quantity ?? null,
        notes: s.notes ?? found?.notes ?? null,
        printStatus: s.printStatus ?? found?.printStatus ?? 'PENDING',
        printedAt: s.printedAt ? new Date(s.printedAt) : found?.printedAt ?? null,
        storageLocationId:
          s.storageLocationId !== undefined
            ? s.storageLocationId
            : found?.storageLocationId ?? null,
        storageNotes:
          s.storageNotes !== undefined ? s.storageNotes : found?.storageNotes ?? null,
      };
      const saved = found
        ? await this.sampleRepo.save(this.sampleRepo.create({ ...found, ...data }))
        : await this.sampleRepo.save(
            this.sampleRepo.create({
              ...data,
              order,
              statusId: sampleStatus!.id,
              organizationId: tenant?.organizationId ?? null,
              locationId: tenant?.locationId ?? null,
            }),
          );
      ids.push(saved.id);
    }
    for (const ex of existing) {
      if (!wanted.has(ex.barcode)) await this.sampleRepo.softDelete(ex.id);
    }
    return ids;
  }

  private async upsertItems(order: OrderEntity, items: any[], assignments: any[] | undefined, sampleIds: (string | null)[]): Promise<void> {
    const testDefinitionIds = await this.resolveTestDefinitionIds(items);
    const existing = await this.orderItemRepo.find({ where: { order: { id: order.id } } });
    const byTest = new Map(existing.map((i) => [i.testDefinitionId, i]));
    const wanted = new Set(testDefinitionIds);
    const assignmentByTest = new Map<string, number>();
    for (const a of assignments ?? []) assignmentByTest.set(a.testDefinitionId, a.sampleIndex);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const resolvedId = testDefinitionIds[i];
      const index = assignmentByTest.get(item.testDefinitionId);
      const sampleId = typeof index === 'number' ? sampleIds[index] ?? null : item.sampleId ?? null;
      const found = byTest.get(resolvedId);
      const data = {
        testDefinitionId: resolvedId,
        referenceCode: item.referenceCode ?? found?.referenceCode ?? null,
        sampleId,
        notes: item.notes ?? found?.notes ?? null,
        status: found?.status ?? 'PENDING',
      };
      await this.orderItemRepo.save(found ? this.orderItemRepo.create({ ...found, ...data }) : this.orderItemRepo.create({ ...data, order }));
    }
    for (const ex of existing) {
      if (!wanted.has(ex.testDefinitionId)) await this.orderItemRepo.softDelete(ex.id);
    }
  }

  private async createSamples(order: OrderEntity, samples: any[], tenant?: TenantContext): Promise<(string | null)[]> {
    const ids: (string | null)[] = [];
    if (!samples?.length) return ids;
    const sampleStatus = await this.statuses.findByCode('COLLECTED');
    for (const s of samples) {
      const saved = await this.sampleRepo.save(
        this.sampleRepo.create({
          order,
          barcode: s.barcode,
          sampleTypeId: s.sampleTypeId ?? null,
          collector: s.collector ?? null,
          collectionDate: s.collectionDate ? new Date(s.collectionDate) : null,
          receivedDate: s.receivedDate ? new Date(s.receivedDate) : null,
          collectionMethod: s.collectionMethod ?? null,
          collectionConditions: s.collectionConditions ?? null,
          quantity: s.quantity ?? null,
          notes: s.notes ?? null,
          printStatus: s.printStatus ?? 'PENDING',
          printedAt: s.printedAt ? new Date(s.printedAt) : null,
          storageLocationId: s.storageLocationId ?? null,
          storageNotes: s.storageNotes ?? null,
          statusId: sampleStatus!.id,
          organizationId: tenant?.organizationId ?? null,
          locationId: tenant?.locationId ?? null,
        }),
      );
      ids.push(saved.id);
    }
    return ids;
  }

  private resolveSampleIds(items: any[], assignments: any[] | undefined, sampleIds: (string | null)[]): (string | null)[] {
    const assignmentByTest = new Map<string, number>();
    for (const a of assignments ?? []) {
      assignmentByTest.set(a.testDefinitionId, a.sampleIndex);
    }
    return items.map((item) => {
      const index = assignmentByTest.get(item.testDefinitionId);
      if (typeof index === 'number') return sampleIds[index] ?? null;
      return item.sampleId ?? null;
    });
  }

  private async applyAssignments(orderId: string, assignments: any[]): Promise<void> {
    if (!assignments?.length) return;
    const samples = await this.sampleRepo.find({
      where: { order: { id: orderId } },
      order: { createdAt: 'ASC' },
    });
    const items = await this.orderItemRepo.find({ where: { order: { id: orderId } } });
    const assignmentByTest = new Map<string, number>();
    for (const a of assignments) assignmentByTest.set(a.testDefinitionId, a.sampleIndex);
    for (const item of items) {
      const index = assignmentByTest.get(item.testDefinitionId);
      item.sampleId = typeof index === 'number' ? (samples[index]?.id ?? null) : null;
    }
    await this.orderItemRepo.save(items);
  }

  async findByOrderNumber(orderNumber: string, tenant?: TenantContext): Promise<any> {
    const qb = this.repo.createQueryBuilder('orders')
      .where('orders.orderNumber = :orderNumber', { orderNumber })
      .andWhere('orders.deleted_at IS NULL');

    if (tenant && !tenant.isGlobalAdmin) {
      qb.andWhere('(orders.organization_id = :orgId OR orders.organization_id IS NULL)', { orgId: tenant.organizationId });
      if (tenant.locationId) {
        qb.andWhere('(orders.location_id = :locId OR orders.location_id IS NULL)', { locId: tenant.locationId });
      }
    }

    for (const relation of this.relations()) {
      if (!relation.includes('.')) {
        qb.leftJoinAndSelect(`orders.${relation}`, relation);
      } else {
        const parts = relation.split('.');
        qb.leftJoinAndSelect(`${parts[0]}.${parts[1]}`, parts[1]);
      }
    }

    const item = await qb.getOne();
    if (!item) {
      throw new NotFoundException('Order not found');
    }
    return this.serialize(item);
  }

  async saveStepProgress(id: string, step: 'enter' | 'collect' | 'label' | 'qa', tenant?: TenantContext): Promise<any> {
    const order = await this.findOne(id, tenant);
    order.stepProgress = { ...order.stepProgress, [step]: true };
    if (step === 'qa') {
      order.status = 'COMPLETED';
      order.completedDate = new Date().toISOString().split('T')[0];
    }
    await this.repo.save(order);
    return this.findOne(id, tenant);
  }

  async transitionStatus(id: string, toStatusId: string, tenant?: TenantContext, userId?: string, reason?: string): Promise<any> {
    const order = await this.findOne(id, tenant);
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    const toStatus = await this.statuses.findOne(toStatusId);
    const fromCode = order.status;
    const toCode = toStatus.code;
    if (!this.statuses.validateTransition('ORDER', fromCode, toCode)) {
      throw new BadRequestException(`Invalid transition from "${fromCode}" to "${toCode}"`);
    }
    order.status = toCode;
    order.statusId = toStatusId;
    if (toCode === 'COMPLETED') order.completedDate = new Date().toISOString().split('T')[0];
    await this.repo.save(order);
    await this.statusHistory.record('Order', id, toStatusId, order.statusId, userId ?? null, reason ?? null);
    return this.findOne(id, tenant);
  }

  async replace(id: string, payload: CreateOrderDto, tenant?: TenantContext): Promise<any> {
    const order = await this.findOne(id, tenant);
    const orderNumber = order.orderNumber;
    const initialStatus = await this.statuses.findByCode('ENTERED');
    await this.orderItemRepo.delete({ order: { id } });
    const saved = await this.repo.save({
      ...order,
      orderNumber,
      patientId: payload.patientId,
      patientNumber: payload.patientNumber ?? order.patientNumber,
      referenceCode: payload.referenceCode ?? order.referenceCode,
      internalReference: payload.internalReference ?? null,
      externalReference: payload.externalReference ?? null,
      patientName: payload.patientName,
      patientAge: payload.patientAge ?? null,
      patientGender: payload.patientGender ?? null,
      patientDateOfBirth: payload.patientDateOfBirth ?? null,
      priorityId: payload.priorityId ?? null,
      requestedDate: payload.requestedDate ?? null,
      requesterName: payload.requesterName ?? null,
      requesterPhone: payload.requesterPhone ?? null,
      diagnosis: payload.diagnosis ?? null,
      clinicalNotes: payload.clinicalNotes ?? null,
      notes: payload.notes ?? null,
      createdById: payload.createdById ?? order.createdById ?? null,
      stepProgress: payload.stepProgress ?? { enter: false, collect: false, label: false, qa: false },
      qaChecks: payload.qaChecks ?? order.qaChecks ?? {},
      status: 'ENTERED',
      statusId: initialStatus?.id ?? null,
    });
    if (payload.items?.length) {
      await this.orderItemRepo.save(
        payload.items.map((item) =>
          this.orderItemRepo.create({
            order: saved,
            testDefinitionId: item.testDefinitionId,
            sampleId: item.sampleId ?? null,
            notes: item.notes ?? null,
            status: 'PENDING',
          }),
        ),
      );
    }
    if (payload.assignments?.length) {
      await this.applyAssignments(saved.id, payload.assignments as any[]);
    }
    return this.findOne(saved.id, tenant);
  }
}
