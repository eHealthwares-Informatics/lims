import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderEntity, QcAlertEntity, QcResultEntity, ResultEntity, SampleEntity } from '../entities';
import { TenantContext } from '../../../common/tenant-context';
import { NotificationService } from './notification.service';
import { PatientsService } from './patients.service';

/**
 * LIS notification triggers (issues #109/#110/#111).
 *
 * Every trigger renders the message here and hands it to the notification
 * engine, which dispatches through the conversations module. The sender-app
 * ledger (NotificationDispatchEntity) keeps the sent-message copy per event.
 *
 * All methods are best-effort: a notification failure never breaks the
 * underlying LIS operation.
 */
@Injectable()
export class NotificationTriggersService {
  private readonly logger = new Logger(NotificationTriggersService.name);

  constructor(
    private readonly notifications: NotificationService,
    private readonly patients: PatientsService,
    private readonly config: ConfigService,
  ) {}

  private get labAlertPhone(): string {
    return this.config.get<string>('LIS_LAB_ALERT_PHONE', '') ?? '';
  }

  // ------------------------------------------------------------- patient (#109)

  /** Sample received confirmation to the patient (WhatsApp/SMS). */
  async sampleReceived(sample: SampleEntity, tenant?: TenantContext): Promise<void> {
    try {
      let phone: string | null = null;
      let patientName: string = sample.order?.patientName ?? 'Patient';
      if (sample.order?.patientId) {
        const patient = await this.patients.findByPatientId(sample.order.patientId);
        phone = patient?.phone ?? null;
        if (patient?.firstName) patientName = `${patient.firstName} ${patient.lastName}`;
      }

      const barcode = sample.barcode ?? '';
      const body =
        `Hello ${patientName}, your sample (${barcode}) for order ` +
        `${sample.order?.orderNumber ?? ''} has been received at the laboratory. ` +
        `You will be notified when your results are ready.`;

      await this.notifications.emit(
        {
          eventKey: 'SAMPLE_RECEIVED',
          platform: 'LIS_SAMPLE_RECEIVED',
          audience: 'PATIENT',
          title: 'Sample received',
          body,
          recipient: { phone },
          channels: ['WHATSAPP', 'SMS'],
          variables: { patientName, barcode, orderNumber: sample.order?.orderNumber ?? '' },
          relatedEntityType: 'Sample',
          relatedEntityId: sample.id,
        },
        tenant,
        'LIS_SAMPLE_RECEIVED',
      );
    } catch (error: any) {
      this.logger.warn(`sampleReceived notification failed: ${error?.message ?? error}`);
    }
  }

  /** Result ready — sent to the patient when the result gets finalized. */
  async resultReady(
    result: ResultEntity,
    tenant?: TenantContext,
    platform: 'LIS_RESULT_READY' | 'LIS_RESULT_AMENDED' = 'LIS_RESULT_READY',
  ): Promise<void> {
    try {
      const order = result.orderItem?.order;
      if (!order) return;
      const patient = await this.patients.findByPatientId(order.patientId);
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : order.patientName;
      const testName = result.orderItem?.testDefinition?.name ?? '';
      const amended = platform === 'LIS_RESULT_AMENDED';
      const body = amended
        ? `Hello ${patientName}, an updated result for ${testName} (order ${order.orderNumber}) has been issued. The previous result is superseded.`
        : `Hello ${patientName}, your laboratory results for order ${order.orderNumber} are ready. Test: ${testName}.`;

      await this.notifications.emit(
        {
          eventKey: amended ? 'RESULT_AMENDED' : 'RESULT_READY',
          platform,
          audience: 'PATIENT',
          title: amended ? 'Result updated' : 'Results ready',
          body,
          recipient: { phone: patient?.phone ?? null, email: patient?.email ?? null },
          channels: ['WHATSAPP', 'SMS', 'EMAIL'],
          variables: { patientName, orderNumber: order.orderNumber, testName },
          relatedEntityType: 'Result',
          relatedEntityId: result.id,
        },
        tenant,
        platform,
      );
    } catch (error: any) {
      this.logger.warn(`resultReady notification failed: ${error?.message ?? error}`);
    }
  }

  /** Payment reminder (e.g. outstanding balance before/after collection). */
  async paymentReminder(order: OrderEntity, balanceDue: string, tenant?: TenantContext): Promise<void> {
    try {
      const patient = await this.patients.findByPatientId(order.patientId);
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : order.patientName;
      const body =
        `Hello ${patientName}, a balance of ${balanceDue} is outstanding for ` +
        `laboratory order ${order.orderNumber}. Please settle to avoid processing delays.`;

      await this.notifications.emit(
        {
          eventKey: 'PAYMENT_REMINDER',
          platform: 'LIS_PAYMENT_REMINDER',
          audience: 'PATIENT',
          title: 'Payment reminder',
          body,
          recipient: { phone: patient?.phone ?? order.requesterPhone ?? null },
          channels: ['SMS', 'WHATSAPP'],
          variables: { patientName, orderNumber: order.orderNumber, balanceDue },
          relatedEntityType: 'Order',
          relatedEntityId: order.id,
        },
        tenant,
        'LIS_PAYMENT_REMINDER',
      );
    } catch (error: any) {
      this.logger.warn(`paymentReminder notification failed: ${error?.message ?? error}`);
    }
  }

  // -------------------------------------------------------------- doctor (#110)

  /**
   * Critical result alert — sent immediately to the requesting doctor
   * (requesterPhone on the order).
   */
  async criticalResult(result: ResultEntity, tenant?: TenantContext): Promise<void> {
    try {
      const order = result.orderItem?.order;
      if (!order) return;
      const testName = result.orderItem?.testDefinition?.name ?? '';
      const body =
        `CRITICAL RESULT: ${testName} = ${result.value ?? ''} ` +
        `${result.unit?.code ?? ''} for patient ${order.patientName} ` +
        `(${order.orderNumber}). Please review immediately.`;

      await this.notifications.emit(
        {
          eventKey: 'CRITICAL_RESULT',
          platform: 'LIS_CRITICAL_RESULT',
          audience: 'DOCTOR',
          title: 'Critical result',
          body,
          recipient: { phone: order.requesterPhone ?? null },
          channels: ['SMS'],
          variables: {
            testName,
            value: String(result.value ?? ''),
            patientName: order.patientName,
            orderNumber: order.orderNumber,
          },
          relatedEntityType: 'Result',
          relatedEntityId: result.id,
        },
        tenant,
        'LIS_CRITICAL_RESULT',
      );
    } catch (error: any) {
      this.logger.warn(`criticalResult notification failed: ${error?.message ?? error}`);
    }
  }

  /** Result amendment notification (correct/finalize re-issue path). */
  async resultAmended(result: ResultEntity, tenant?: TenantContext): Promise<void> {
    await this.resultReady(result, tenant, 'LIS_RESULT_AMENDED');
  }

  // ------------------------------------------------------------------- lab (#111)

  /** QC failed — lab alert from Westgard evaluation. */
  async qcFailed(
    alert: QcAlertEntity,
    qcResult?: QcResultEntity | null,
    tenant?: TenantContext,
  ): Promise<void> {
    try {
      const body =
        `QC ALERT (${alert.severity}): rule ${alert.rule} tripped` +
        `${alert.description ? ` — ${alert.description}` : ''}` +
        `${qcResult?.testDefinition?.name ? ` on ${qcResult.testDefinition.name}` : ''}.`;

      await this.notifications.emit(
        {
          eventKey: 'QC_FAILED',
          platform: 'LIS_QC_FAILED',
          audience: 'LAB',
          title: 'QC alert',
          body,
          recipient: { phone: this.labAlertPhone || null },
          channels: this.labAlertPhone ? ['SMS'] : [],
          variables: { rule: alert.rule, severity: alert.severity, description: alert.description ?? '' },
          relatedEntityType: 'QcAlert',
          relatedEntityId: alert.id,
        },
        tenant,
        'LIS_QC_FAILED',
      );
    } catch (error: any) {
      this.logger.warn(`qcFailed notification failed: ${error?.message ?? error}`);
    }
  }

  /** Sample delayed / TAT breach — lab alert when an order ages past SLA. */
  async orderTatBreach(
    order: OrderEntity,
    hoursElapsed: number,
    slaHours: number,
    tenant?: TenantContext,
  ): Promise<void> {
    try {
      const body =
        `TAT BREACH: order ${order.orderNumber} for ${order.patientName} is ` +
        `${hoursElapsed}h old (SLA ${slaHours}h) and is not yet complete.`;

      await this.notifications.emit(
        {
          eventKey: 'ORDER_TAT_BREACH',
          platform: 'LIS_ORDER_TAT_BREACH',
          audience: 'LAB',
          title: 'TAT breach',
          body,
          recipient: { phone: this.labAlertPhone || null },
          channels: this.labAlertPhone ? ['SMS'] : [],
          variables: {
            orderNumber: order.orderNumber,
            patientName: order.patientName,
            hoursElapsed: String(hoursElapsed),
            slaHours: String(slaHours),
          },
          relatedEntityType: 'Order',
          relatedEntityId: order.id,
        },
        tenant,
        'LIS_ORDER_TAT_BREACH',
      );
    } catch (error: any) {
      this.logger.warn(`orderTatBreach notification failed: ${error?.message ?? error}`);
    }
  }

  /** Idempotency helper for schedulers: has a dispatch been sent for this entity+event? */
  async hasDispatch(eventKey: string, relatedEntityType: string, relatedEntityId: string): Promise<boolean> {
    return this.notifications.hasDispatch(eventKey, relatedEntityType, relatedEntityId);
  }
}
