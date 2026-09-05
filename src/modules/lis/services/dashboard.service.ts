import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
  private readonly tatThresholdHours: number;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {
    this.tatThresholdHours = this.config.get<number>('DASHBOARD_TAT_THRESHOLD_HOURS', 24);
  }

  private orgFilter(col = 'o'): string {
    return `(${col}.organization_id = :orgId OR ${col}.organization_id IS NULL)`;
  }

  async getMetrics(organizationId: string, userId?: string | null) {
    const [totalOrders] = await this.totalOrders(organizationId);
    const [ordersInProgress] = await this.ordersInProgressCount(organizationId);
    const [ordersCompletedToday] = await this.ordersCompletedTodayCount(organizationId);
    const [receivedToday] = await this.receivedTodayCount(organizationId);
    const [pendingResults] = await this.pendingResultsCount(organizationId);
    const [readyForValidation] = await this.readyForValidationCount(organizationId);
    const [partiallyCompleted] = await this.partiallyCompletedTodayCount(organizationId);
    const [enteredToday] = await this.enteredByUserTodayCount(organizationId, userId);
    const [rejectedToday] = await this.rejectedTodayCount(organizationId);
    const [unprinted] = await this.unprintedResultsCount(organizationId);
    const [avgTatMinutes] = await this.averageTurnAroundTime(organizationId);
    const [delayedTat] = await this.delayedTurnAroundCount(organizationId);
    const tatSubMetrics = await this.tatSubMetricsCalc(organizationId);
    const dailyTrend = await this.dailyOrderTrend(organizationId);

    const avgTatHours = avgTatMinutes ? Math.round(avgTatMinutes / 60 * 10) / 10 : 0;

    return {
      totalOrders,
      ordersInProgress,
      ordersCompletedToday,
      receivedToday,
      pendingResults,
      readyForValidation,
      partiallyCompletedToday: partiallyCompleted,
      ordersEnteredByUserToday: enteredToday,
      ordersRejectedToday: rejectedToday,
      unPrintedResults: unprinted,
      averageTurnAroundTimeHours: avgTatHours,
      delayedTurnAroundCount: delayedTat,
      delayedTurnAroundThresholdHours: this.tatThresholdHours,
      tatSubMetrics,
      dailyTrend,
    };
  }

  // ── Count queries ────────────────────────────────────────────────

  async totalOrders(organizationId: string): Promise<[number, number]> {
    const result = await this.dataSource.createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .getRawOne();
    return [Number(result?.count ?? 0), 0];
  }

  async ordersInProgressCount(organizationId: string): Promise<[number, number]> {
    const result = await this.dataSource.createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere('o.status NOT IN (:...completed)', { completed: ['COMPLETED', 'CANCELLED'] })
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .getRawOne();
    return [Number(result?.count ?? 0), 0];
  }

  async ordersCompletedTodayCount(organizationId: string): Promise<[number, number]> {
    const result = await this.dataSource.createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere('o."completedDate"::date = CURRENT_DATE')
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .getRawOne();
    return [Number(result?.count ?? 0), 0];
  }

  async receivedTodayCount(organizationId: string): Promise<[number, number]> {
    const result = await this.dataSource.createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere('o."receivedDate"::date = CURRENT_DATE')
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .getRawOne();
    return [Number(result?.count ?? 0), 0];
  }

  async pendingResultsCount(organizationId: string): Promise<[number, number]> {
    const result = await this.dataSource.createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('lis_results', 'r')
      .innerJoin('lis_order_items', 'oi', 'r.order_item_id = oi.id')
      .innerJoin('lis_orders', 'o', 'oi.order_id = o.id')
      .where('r.deleted_at IS NULL')
      .andWhere('r.status = :status', { status: 'PENDING' })
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .getRawOne();
    return [Number(result?.count ?? 0), 0];
  }

  async readyForValidationCount(organizationId: string): Promise<[number, number]> {
    const result = await this.dataSource.createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('lis_results', 'r')
      .innerJoin('lis_order_items', 'oi', 'r.order_item_id = oi.id')
      .innerJoin('lis_orders', 'o', 'oi.order_id = o.id')
      .where('r.deleted_at IS NULL')
      .andWhere('r.status = :status', { status: 'TECHNICAL_REVIEW' })
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .getRawOne();
    return [Number(result?.count ?? 0), 0];
  }

  async partiallyCompletedTodayCount(organizationId: string): Promise<[number, number]> {
    const result = await this.dataSource.createQueryBuilder()
      .select('COUNT(DISTINCT o.id)', 'count')
      .from('lis_orders', 'o')
      .innerJoin('lis_order_items', 'oi', 'oi.order_id = o.id')
      .where('o.deleted_at IS NULL')
      .andWhere('o.status NOT IN (:...completed)', { completed: ['COMPLETED', 'CANCELLED'] })
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .andWhere(`
        EXISTS (SELECT 1 FROM lis_results r1 WHERE r1.order_item_id = oi.id AND r1.status IN ('FINALIZED', 'TECHNICAL_REVIEW'))
        AND EXISTS (SELECT 1 FROM lis_results r2 WHERE r2.order_item_id = oi.id AND r2.status = 'PENDING')
      `)
      .getRawOne();
    return [Number(result?.count ?? 0), 0];
  }

  async enteredByUserTodayCount(organizationId: string, userId?: string | null): Promise<[number, number]> {
    if (!userId) return [0, 0];
    const result = await this.dataSource.createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere('o.created_by_id = :userId', { userId })
      .andWhere('o."created_at"::date = CURRENT_DATE')
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .getRawOne();
    return [Number(result?.count ?? 0), 0];
  }

  async rejectedTodayCount(organizationId: string): Promise<[number, number]> {
    const result = await this.dataSource.createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('lis_samples', 's')
      .innerJoin('lis_orders', 'o', 's.order_id = o.id')
      .where('s.deleted_at IS NULL')
      .andWhere('s.rejected = true')
      .andWhere('s."updated_at"::date = CURRENT_DATE')
      .andWhere(this.orgFilter('o'), { orgId: organizationId })
      .getRawOne();
    return [Number(result?.count ?? 0), 0];
  }

  async unprintedResultsCount(organizationId: string): Promise<[number, number]> {
    const result = await this.dataSource.createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('lis_results', 'r')
      .innerJoin('lis_order_items', 'oi', 'r.order_item_id = oi.id')
      .innerJoin('lis_orders', 'o', 'oi.order_id = o.id')
      .where('r.deleted_at IS NULL')
      .andWhere('r.status = :status', { status: 'FINALIZED' })
      .andWhere('r."acknowledgedAt" IS NULL')
      .andWhere(this.orgFilter('o'), { orgId: organizationId })
      .getRawOne();
    return [Number(result?.count ?? 0), 0];
  }

  async averageTurnAroundTime(organizationId: string): Promise<[number, number]> {
    const result = await this.dataSource.createQueryBuilder()
      .select("COALESCE(AVG(EXTRACT(EPOCH FROM (o.\"completedDate\"::timestamp - o.\"receivedDate\"::timestamp)) / 60), 0)", 'avgMinutes')
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere('o."completedDate" IS NOT NULL')
      .andWhere('o."receivedDate" IS NOT NULL')
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .getRawOne();
    return [Number(result?.avgMinutes ?? 0), 0];
  }

  async delayedTurnAroundCount(organizationId: string): Promise<[number, number]> {
    const result = await this.dataSource.createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere('o.status NOT IN (:...completed)', { completed: ['COMPLETED', 'CANCELLED'] })
      .andWhere(`EXTRACT(EPOCH FROM (NOW() - o."receivedDate"::timestamp)) / 3600 > :threshold`, { threshold: this.tatThresholdHours })
      .andWhere('o."receivedDate" IS NOT NULL')
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .getRawOne();
    return [Number(result?.count ?? 0), 0];
  }

  // ── TAT sub-metrics ──────────────────────────────────────────────

  async tatSubMetricsCalc(organizationId: string): Promise<{
    receptionToValidationHours: number;
    receptionToResultHours: number;
    resultToValidationHours: number;
  }> {
    const receptionToValidation = await this.dataSource.createQueryBuilder()
      .select("COALESCE(AVG(EXTRACT(EPOCH FROM (r.\"validatedDate\"::timestamp - o.\"receivedDate\"::timestamp)) / 3600), 0)", 'hours')
      .from('lis_results', 'r')
      .innerJoin('lis_order_items', 'oi', 'r.order_item_id = oi.id')
      .innerJoin('lis_orders', 'o', 'oi.order_id = o.id')
      .where('r.deleted_at IS NULL')
      .andWhere('r.status = :status', { status: 'FINALIZED' })
      .andWhere('r."validatedDate" IS NOT NULL')
      .andWhere('o."receivedDate" IS NOT NULL')
      .andWhere(this.orgFilter('o'), { orgId: organizationId })
      .getRawOne();

    const receptionToResult = await this.dataSource.createQueryBuilder()
      .select("COALESCE(AVG(EXTRACT(EPOCH FROM (r.\"enteredDate\"::timestamp - o.\"receivedDate\"::timestamp)) / 3600), 0)", 'hours')
      .from('lis_results', 'r')
      .innerJoin('lis_order_items', 'oi', 'r.order_item_id = oi.id')
      .innerJoin('lis_orders', 'o', 'oi.order_id = o.id')
      .where('r.deleted_at IS NULL')
      .andWhere("r.status IN ('TECHNICAL_REVIEW', 'FINALIZED')")
      .andWhere('r."enteredDate" IS NOT NULL')
      .andWhere('o."receivedDate" IS NOT NULL')
      .andWhere(this.orgFilter('o'), { orgId: organizationId })
      .getRawOne();

    const resultToValidation = await this.dataSource.createQueryBuilder()
      .select("COALESCE(AVG(EXTRACT(EPOCH FROM (r.\"validatedDate\"::timestamp - r.\"enteredDate\"::timestamp)) / 3600), 0)", 'hours')
      .from('lis_results', 'r')
      .where('r.deleted_at IS NULL')
      .andWhere('r.status = :status', { status: 'FINALIZED' })
      .andWhere('r."validatedDate" IS NOT NULL')
      .andWhere('r."enteredDate" IS NOT NULL')
      .getRawOne();

    return {
      receptionToValidationHours: Math.round(Number(receptionToValidation?.hours ?? 0) * 10) / 10,
      receptionToResultHours: Math.round(Number(receptionToResult?.hours ?? 0) * 10) / 10,
      resultToValidationHours: Math.round(Number(resultToValidation?.hours ?? 0) * 10) / 10,
    };
  }

  // ── Daily trend ──────────────────────────────────────────────────

  async dailyOrderTrend(organizationId: string): Promise<{ date: string; received: number; completed: number }[]> {
    const received = await this.dataSource.createQueryBuilder()
      .select('o."receivedDate"::date', 'date')
      .addSelect('COUNT(*)', 'count')
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere("o.\"receivedDate\"::date >= CURRENT_DATE - INTERVAL '7 days'")
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .groupBy('o."receivedDate"::date')
      .orderBy('o."receivedDate"::date', 'ASC')
      .getRawMany();

    const completed = await this.dataSource.createQueryBuilder()
      .select('o."completedDate"::date', 'date')
      .addSelect('COUNT(*)', 'count')
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere("o.\"completedDate\"::date >= CURRENT_DATE - INTERVAL '7 days'")
      .andWhere(this.orgFilter(), { orgId: organizationId })
      .groupBy('o."completedDate"::date')
      .orderBy('o."completedDate"::date', 'ASC')
      .getRawMany();

    const dateMap = new Map<string, { date: string; received: number; completed: number }>();
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      dateMap.set(ds, { date: ds, received: 0, completed: 0 });
    }

    for (const row of received) {
      const entry = dateMap.get(row.date);
      if (entry) entry.received = Number(row.count);
    }
    for (const row of completed) {
      const entry = dateMap.get(row.date);
      if (entry) entry.completed = Number(row.count);
    }

    return Array.from(dateMap.values());
  }

  // ── Drilldown ────────────────────────────────────────────────────

  async getMetricItems(
    type: string,
    organizationId: string,
    userId?: string | null,
    pagination?: { offset?: number; limit?: number },
  ): Promise<{ data: Record<string, any>[]; total: number }> {
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? 50;

    switch (type) {
      case 'orders-in-progress':
        return this.drilldownOrdersInProgress(organizationId, offset, limit);
      case 'ready-for-validation':
        return this.drilldownReadyForValidation(organizationId, offset, limit);
      case 'completed-today':
        return this.drilldownCompletedToday(organizationId, offset, limit);
      case 'partially-completed-today':
        return this.drilldownPartiallyCompletedToday(organizationId, offset, limit);
      case 'entered-by-user-today':
        return this.drilldownEnteredByUserToday(organizationId, userId, offset, limit);
      case 'rejected-today':
        return this.drilldownRejectedToday(organizationId, offset, limit);
      case 'unprinted-results':
        return this.drilldownUnprintedResults(organizationId, offset, limit);
      case 'received-today':
        return this.drilldownReceivedToday(organizationId, offset, limit);
      case 'delayed-turnaround':
        return this.drilldownDelayedTurnaround(organizationId, offset, limit);
      default:
        throw new NotFoundException(`Unknown metric type: ${type}`);
    }
  }

  private async drilldownOrdersInProgress(orgId: string, offset: number, limit: number): Promise<{ data: Record<string, any>[]; total: number }> {
    const baseQb = () => this.dataSource.createQueryBuilder()
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere('o.status NOT IN (:...completed)', { completed: ['COMPLETED', 'CANCELLED'] })
      .andWhere(this.orgFilter(), { orgId });

    const countResult = await baseQb().select('COUNT(*)', 'count').getRawOne();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQb()
      .select(['o.id', 'o."orderNumber"', 'o."patientName"', 'o.status', 'o."receivedDate"', 'o."priorityId"'])
      .orderBy('o.created_at', 'DESC')
      .offset(offset).limit(limit)
      .getRawMany();

    return { data: rows.map(this.mapOrderRow), total };
  }

  private async drilldownReadyForValidation(orgId: string, offset: number, limit: number): Promise<{ data: Record<string, any>[]; total: number }> {
    const baseQb = () => this.dataSource.createQueryBuilder()
      .from('lis_results', 'r')
      .innerJoin('lis_order_items', 'oi', 'r.order_item_id = oi.id')
      .innerJoin('lis_orders', 'o', 'oi.order_id = o.id')
      .where('r.deleted_at IS NULL')
      .andWhere('r.status = :status', { status: 'TECHNICAL_REVIEW' })
      .andWhere(this.orgFilter('o'), { orgId });

    const countResult = await baseQb().select('COUNT(DISTINCT o.id)', 'count').getRawOne();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQb()
      .select(['o.id', 'o."orderNumber"', 'o."patientName"', 'r.id as resultId', 'r.value', 'oi.id as orderItemId'])
      .orderBy('o.created_at', 'DESC')
      .offset(offset).limit(limit)
      .getRawMany();

    return { data: rows.map((r) => ({ orderNumber: r.orderNumber, patientName: r.patientName, resultValue: r.value })), total };
  }

  private async drilldownCompletedToday(orgId: string, offset: number, limit: number): Promise<{ data: Record<string, any>[]; total: number }> {
    const baseQb = () => this.dataSource.createQueryBuilder()
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere('o."completedDate"::date = CURRENT_DATE')
      .andWhere(this.orgFilter(), { orgId });

    const countResult = await baseQb().select('COUNT(*)', 'count').getRawOne();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQb()
      .select(['o.id', 'o."orderNumber"', 'o."patientName"', 'o."completedDate"', 'o."priorityId"'])
      .orderBy('o."completedDate"', 'DESC')
      .offset(offset).limit(limit)
      .getRawMany();

    return { data: rows.map(this.mapOrderRow), total };
  }

  private async drilldownPartiallyCompletedToday(orgId: string, offset: number, limit: number): Promise<{ data: Record<string, any>[]; total: number }> {
    const baseQb = () => this.dataSource.createQueryBuilder()
      .from('lis_orders', 'o')
      .innerJoin('lis_order_items', 'oi', 'oi.order_id = o.id')
      .where('o.deleted_at IS NULL')
      .andWhere('o.status NOT IN (:...completed)', { completed: ['COMPLETED', 'CANCELLED'] })
      .andWhere(this.orgFilter(), { orgId })
      .andWhere(`
        EXISTS (SELECT 1 FROM lis_results r1 WHERE r1.order_item_id = oi.id AND r1.status IN ('FINALIZED', 'TECHNICAL_REVIEW'))
        AND EXISTS (SELECT 1 FROM lis_results r2 WHERE r2.order_item_id = oi.id AND r2.status = 'PENDING')
      `);

    const countResult = await baseQb().select('COUNT(DISTINCT o.id)', 'count').getRawOne();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQb()
    .distinct(true)
      .select(['o.id', 'o."orderNumber"', 'o."patientName"', 'o.status', 'o."receivedDate"'])
      .orderBy('o.created_at', 'DESC')
      .offset(offset).limit(limit)
      .getRawMany();

    return { data: rows.map(this.mapOrderRow), total };
  }

  private async drilldownEnteredByUserToday(orgId: string, userId?: string | null, offset: number = 0, limit: number = 50): Promise<{ data: Record<string, any>[]; total: number }> {
    if (!userId) return { data: [], total: 0 };

    const baseQb = () => this.dataSource.createQueryBuilder()
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere('o.created_by_id = :userId', { userId })
      .andWhere('o."created_at"::date = CURRENT_DATE')
      .andWhere(this.orgFilter(), { orgId });

    const countResult = await baseQb().select('COUNT(*)', 'count').getRawOne();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQb()
      .select(['o.id', 'o."orderNumber"', 'o."patientName"', 'o.created_at'])
      .orderBy('o."created_at"', 'DESC')
      .offset(offset).limit(limit)
      .getRawMany();

    return {
      data: rows.map((r) => ({
        orderNumber: r.orderNumber,
        patientName: r.patientName,
        createdAt: r.created_at,
      })),
      total,
    };
  }

  private async drilldownRejectedToday(orgId: string, offset: number, limit: number): Promise<{ data: Record<string, any>[]; total: number }> {
    const baseQb = () => this.dataSource.createQueryBuilder()
      .from('lis_samples', 's')
      .innerJoin('lis_orders', 'o', 's.order_id = o.id')
      .where('s.deleted_at IS NULL')
      .andWhere('s.rejected = true')
      .andWhere('s."updated_at"::date = CURRENT_DATE')
      .andWhere(this.orgFilter('o'), { orgId });

    const countResult = await baseQb().select('COUNT(*)', 'count').getRawOne();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQb()
      .leftJoin('lis_sample_types', 'st', 'st.id = s.sample_type_id')
      .select(['s.id', 's.barcode', 'o."orderNumber"', 'st.name AS "sampleTypeName"', 's."rejectionReasonId"'])
      .orderBy('s."updated_at"', 'DESC')
      .offset(offset).limit(limit)
      .getRawMany();

    return {
      data: rows.map((r) => ({
        barcode: r.barcode,
        orderNumber: r.orderNumber,
        sampleType: r.sampleTypeName ?? null,
        rejectionReason: r.rejectionReasonId,
      })),
      total,
    };
  }

  private async drilldownUnprintedResults(orgId: string, offset: number, limit: number): Promise<{ data: Record<string, any>[]; total: number }> {
    const baseQb = () => this.dataSource.createQueryBuilder()
      .from('lis_results', 'r')
      .innerJoin('lis_order_items', 'oi', 'r.order_item_id = oi.id')
      .innerJoin('lis_orders', 'o', 'oi.order_id = o.id')
      .where('r.deleted_at IS NULL')
      .andWhere('r.status = :status', { status: 'FINALIZED' })
      .andWhere('r."acknowledgedAt" IS NULL')
      .andWhere(this.orgFilter('o'), { orgId });

    const countResult = await baseQb().select('COUNT(*)', 'count').getRawOne();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQb()
      .select(['r.id', 'o."orderNumber"', 'o."patientName"', 'r."validatedDate"'])
      .orderBy('r."validatedDate"', 'DESC')
      .offset(offset).limit(limit)
      .getRawMany();

    return {
      data: rows.map((r) => ({
        orderNumber: r.orderNumber,
        patientName: r.patientName,
        validatedDate: r.validatedDate,
      })),
      total,
    };
  }

  private async drilldownReceivedToday(orgId: string, offset: number, limit: number): Promise<{ data: Record<string, any>[]; total: number }> {
    const baseQb = () => this.dataSource.createQueryBuilder()
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere('o."receivedDate"::date = CURRENT_DATE')
      .andWhere(this.orgFilter(), { orgId });

    const countResult = await baseQb().select('COUNT(*)', 'count').getRawOne();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQb()
      .select(['o.id', 'o."orderNumber"', 'o."patientName"', 'o."receivedDate"', 'o."requesterName"'])
      .orderBy('o.created_at', 'DESC')
      .offset(offset).limit(limit)
      .getRawMany();

    return {
      data: rows.map((r) => ({
        orderNumber: r.orderNumber,
        patientName: r.patientName,
        receivedDate: r.receivedDate,
        requesterName: r.requesterName,
      })),
      total,
    };
  }

  private async drilldownDelayedTurnaround(orgId: string, offset: number, limit: number): Promise<{ data: Record<string, any>[]; total: number }> {
    const baseQb = () => this.dataSource.createQueryBuilder()
      .from('lis_orders', 'o')
      .where('o.deleted_at IS NULL')
      .andWhere('o.status NOT IN (:...completed)', { completed: ['COMPLETED', 'CANCELLED'] })
      .andWhere(`EXTRACT(EPOCH FROM (NOW() - o."receivedDate"::timestamp)) / 3600 > :threshold`, { threshold: this.tatThresholdHours })
      .andWhere('o."receivedDate" IS NOT NULL')
      .andWhere(this.orgFilter(), { orgId });

    const countResult = await baseQb().select('COUNT(*)', 'count').getRawOne();
    const total = Number(countResult?.count ?? 0);

    const rows = await baseQb()
      .select(['o.id', 'o."orderNumber"', 'o."patientName"', 'o."receivedDate"',
        `EXTRACT(EPOCH FROM (NOW() - o."receivedDate"::timestamp)) / 3600 as hoursSinceReceive`,
      ])
      .orderBy('hoursSinceReceive', 'DESC')
      .offset(offset).limit(limit)
      .getRawMany();

    return {
      data: rows.map((r) => ({
        orderNumber: r.orderNumber,
        patientName: r.patientName,
        receivedDate: r.receivedDate,
        hoursSinceReceive: Math.round(Number(r.hoursSinceReceive ?? 0) * 10) / 10,
      })),
      total,
    };
  }

  private mapOrderRow(r: any): Record<string, any> {
    return {
      id: r.id,
      orderNumber: r.orderNumber,
      patientName: r.patientName,
      status: r.status,
      receivedDate: r.receivedDate,
      priorityId: r.priorityId,
    };
  }
}