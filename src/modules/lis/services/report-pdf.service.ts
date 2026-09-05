import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, ResultEntity, ReferenceRangeEntity } from '../entities';

export interface ReportRow {
  name: string;
  value: string;
  range: string;
  units: string;
  flag: 'Low' | 'High' | 'Normal' | '';
}

export interface ReportGroup {
  title: string;
  rows: ReportRow[];
}

export interface ReportData {
  brand: string;
  patient: {
    name: string;
    sex: string;
    idNumber: string;
    dateOfBirth: string;
    age: string;
    phone: string;
    email: string;
    address: string;
  };
  report: {
    requisitionNumber: string;
    orderReference: string;
    collectionDate: string;
    requestDate: string;
    reportDate: string;
    reportUpdatedDate: string;
    reportType: string;
    priority: string;
    specimenType: string;
    comments: string;
    diagnosis: string;
    testsRequested: string;
  };
  groups: ReportGroup[];
}

@Injectable()
export class ReportPdfService {
  private readonly logger = new Logger(ReportPdfService.name);

  constructor(
    @InjectRepository(OrderEntity) private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(ResultEntity) private readonly resultRepo: Repository<ResultEntity>,
    @InjectRepository(ReferenceRangeEntity) private readonly rangeRepo: Repository<ReferenceRangeEntity>,
  ) {}

  async buildReportData(orderId: string): Promise<ReportData> {
    const order = await this.orderRepo
      .createQueryBuilder('orders')
      .where('orders.id = :id', { id: orderId })
      .andWhere('orders.deleted_at IS NULL')
      .leftJoinAndSelect('orders.items', 'items')
      .leftJoinAndSelect('items.testDefinition', 'testDefinition')
      .leftJoinAndSelect('testDefinition.uom', 'uom')
      .leftJoinAndSelect('orders.priority', 'priority')
      .leftJoinAndSelect('orders.samples', 'samples')
      .leftJoinAndSelect('samples.sampleType', 'sampleType')
      .getOne();

    if (!order) {
      throw new Error('Order not found');
    }

    const itemIds = (order.items ?? []).map((i) => i.id);
    const results = itemIds.length
      ? await this.resultRepo
          .createQueryBuilder('results')
          .where('results.order_item_id IN (:...ids)', { ids: itemIds })
          .andWhere('results.deleted_at IS NULL')
          .getMany()
      : [];
    const resultByItem = new Map<string, ResultEntity>();
    for (const r of results) {
      resultByItem.set(r.orderItemId, r);
    }

    const testIds = [...new Set((order.items ?? []).map((i) => i.testDefinitionId).filter(Boolean))];
    const ranges = testIds.length
      ? await this.rangeRepo
          .createQueryBuilder('ranges')
          .where('ranges.test_definition_id IN (:...ids)', { ids: testIds })
          .andWhere('ranges.deleted_at IS NULL')
          .leftJoinAndSelect('ranges.test', 'test')
          .leftJoinAndSelect('ranges.unit', 'unit')
          .getMany()
      : [];
    const rangesByTest = new Map<string, ReferenceRangeEntity[]>();
    for (const r of ranges) {
      const key = r.test?.id ?? '';
      const list = rangesByTest.get(key) ?? [];
      list.push(r);
      rangesByTest.set(key, list);
    }

    const groups: ReportGroup[] = [];
    for (const item of order.items ?? []) {
      const td = item.testDefinition;
      const result = resultByItem.get(item.id);
      const testRanges = td ? rangesByTest.get(td.id) ?? [] : [];
      const chosenRange = this.pickRange(testRanges, order.patientGender, order.patientAge);
      const value = result?.value ?? item.resultValue ?? '';
      const flag = chosenRange ? this.flagFor(value, chosenRange) : '';

      const groupTitle = `${td?.name ?? 'Test'}:`;
      let group = groups.find((g) => g.title === groupTitle);
      if (!group) {
        group = { title: groupTitle, rows: [] };
        groups.push(group);
      }
      group.rows.push({
        name: td?.name ?? 'Test',
        value,
        range: chosenRange ? `${chosenRange.lowValue}-${chosenRange.highValue}` : '',
        units: chosenRange?.unit?.name ?? td?.uom?.name ?? '',
        flag,
      });
    }

    const spec = (order.samples ?? [])[0];
    const fmt = (d: Date | string | null | undefined): string => {
      if (!d) return '—';
      const date = typeof d === 'string' ? new Date(d) : d;
      return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return {
      brand: 'SYNLAB',
      patient: {
        name: order.patientName ?? '—',
        sex: order.patientGender ?? '—',
        idNumber: order.patientId ?? '—',
        dateOfBirth: order.patientDateOfBirth ?? '—',
        age: order.patientAge != null ? String(order.patientAge) : '—',
        phone: order.requesterPhone ?? '—',
        email: '—',
        address: '—',
      },
      report: {
        requisitionNumber: order.orderNumber ?? '—',
        orderReference: order.internalReference ?? order.externalReference ?? '—',
        collectionDate: fmt(order.collectedDate),
        requestDate: fmt(order.requestedDate),
        reportDate: fmt(order.completedDate ?? order.updatedAt),
        reportUpdatedDate: 'N/A',
        reportType: order.status === 'COMPLETED' ? 'FINAL REPORT' : order.status ?? '—',
        priority: order.priority?.name ?? 'ROUTINE',
        specimenType: spec?.sampleType?.name ?? '—',
        comments: order.clinicalNotes ?? order.notes ?? '—',
        diagnosis: order.diagnosis ?? '—',
        testsRequested:
          (order.items ?? []).map((i) => i.testDefinition?.name ?? 'Test').join(', ') || '—',
      },
      groups,
    };
  }

  renderHtml(data: ReportData): string {
    const esc = (v: string) =>
      String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

    const flagClass = (flag: string): string => {
      const f = flag?.toUpperCase() ?? '';
      if (f === 'LOW') return 'flag-low';
      if (f === 'HIGH') return 'flag-high';
      if (f === 'NORMAL') return 'flag-normal';
      return '';
    };

    const flagLabel = (flag: string): string => {
      const f = flag?.toUpperCase() ?? '';
      if (f === 'LOW') return 'L';
      if (f === 'HIGH') return 'H';
      if (f === 'NORMAL') return 'N';
      return '';
    };

    const testCount = data.groups.reduce((n, g) => n + g.rows.length, 0);
    const sectionName = data.groups.length === 1
      ? data.groups[0].title.replace(/:\s*$/, '')
      : 'Laboratory Results';
    const specimenType = data.report.specimenType || 'Whole blood / EDTA';

    // Build summary cards: first 3 highlighted rows across all groups
    const allRows = data.groups.flatMap((g) => g.rows);
    const summaryRows = allRows
      .filter((r) => r.flag === 'Low' || r.flag === 'High')
      .slice(0, 3);
    const summaryCards = summaryRows.length > 0 ? summaryRows : allRows.slice(0, 3);

    const summaryHtml = summaryCards
      .map(
        (r) =>
          `<div class="card"><div class="label">${esc(r.name)}</div><div class="value">${esc(r.value)}</div><div class="unit">${esc(r.units)}</div></div>`,
      )
      .join('');

    const groupRowsHtml = data.groups
      .map((g) => {
        const header = `<tr class="group"><td colspan="5">${esc(g.title)}</td></tr>`;
        const rows = g.rows
          .map((r) => {
            const c = flagClass(r.flag);
            const fl = flagLabel(r.flag);
            return `<tr>
            <td>${esc(r.name)}</td>
            <td>${esc(r.value)}</td>
            <td class="${c}">${fl}</td>
            <td>${esc(r.range)}</td>
            <td>${esc(r.units)}</td>
          </tr>`;
          })
          .join('');
        return header + rows;
      })
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Final Laboratory Report - ${esc(data.patient.name)}</title>
<style>
  * { box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  body { margin: 0; background: #e9eef0; font-family: Arial, Helvetica, sans-serif; color: #172b35; }
  .page { width: 210mm; min-height: 297mm; margin: 20px auto; background: #fff; padding: 10mm 13mm 8mm; box-shadow: 0 2px 12px rgba(0,0,0,.18); position: relative; }
  .header { display: grid; grid-template-columns: 82px 1fr; gap: 12px; align-items: center; }
  .logo { width: 76px; height: 86px; object-fit: contain; }
  .brand { font-size: 25px; font-weight: 800; letter-spacing: .4px; color: #12384b; }
  .brand span { color: #29a9ad; }
  .subtitle { font-size: 15px; font-weight: 800; color: #253c49; margin-top: 1px; }
  .small { font-size: 8.5px; color: #61717a; margin-top: 4px; }
  .branch { font-size: 9px; font-weight: 700; margin-top: 3px; }
  .stripe { height: 17px; margin-top: 13px; display: flex; overflow: hidden; }
  .stripe .left { flex: 1; background: #086c83; clip-path: polygon(0 0, 100% 0, 92% 100%, 0 100%); }
  .stripe .slashes { width: 115px; background: repeating-linear-gradient(120deg, #fff 0 13px, #12384b 13px 21px, #fff 21px 34px); }
  .stripe .right { flex: 1; background: #31adb0; clip-path: polygon(8% 0, 100% 0, 100% 100%, 0 100%); position: relative; }
  .stripe .right b { position: absolute; right: 18px; top: 2px; color: #fff; font-size: 10px; }
  .patient-grid { display: grid; grid-template-columns: 1.25fr .9fr 1.45fr; margin-top: 12px; border-bottom: 1px solid #b8c7cc; padding-bottom: 9px; }
  .patient, .collection, .barcodebox { padding: 0 12px; border-right: 1px solid #c5d0d4; }
  .patient { padding-left: 10px; }
  .barcodebox { border-right: 0; }
  .patient h2 { margin: 0 0 6px; font-size: 18px; color: #163b4c; }
  .meta { font-size: 10px; line-height: 1.55; color: #68777e; }
  .meta strong { color: #314a56; }
  .collection { font-size: 10px; line-height: 1.55; }
  .collection strong { color: #173e50; font-size: 11px; }
  .barcodebox .code { font-size: 8px; font-weight: 800; text-align: center; margin-bottom: 4px; }
  .dates { font-size: 8.5px; line-height: 1.55; color: #596970; }
  .section-title { margin-top: 11px; border-top: 3px solid #116e82; border-bottom: 2px solid #116e82; padding: 5px 0 4px; font-size: 14px; font-weight: 800; color: #172e39; }
  .section-sub { display:flex; justify-content:space-between; font-size: 8px; color:#7b878c; margin: 5px 0 5px; }
  .summary { display:grid; grid-template-columns:repeat(3,1fr); gap:3px; margin-bottom:5px; }
  .summary .card { background:#e7f4f6; border:1px solid #b8d1d6; padding:7px; }
  .card .label { font-size:8px; font-weight:800; color:#55737c; }
  .card .value { font-size:14px; font-weight:800; color:#08728a; margin-top:1px; }
  .card .unit { font-size:7px; color:#5d6f76; }
  table { width:100%; border-collapse:collapse; font-size:7.5px; }
  th { background:#e9f0f2; color:#42555e; font-size:7.2px; padding:4px 5px; text-align:left; }
  td { padding:3.4px 5px; border-bottom:1px solid #d3dde0; color:#354850; }
  td:nth-child(2) { font-weight:800; text-align:center; color:#172f3b; }
  td:nth-child(3) { text-align:center; font-weight:800; }
  td:nth-child(4), td:nth-child(5) { text-align:center; }
  .group td { background:#086c7e; color:#fff; font-weight:800; font-size:7.5px; padding:4px 6px; }
  .flag-low { color:#d38b1e !important; background:#fff1dc; border-radius:3px; }
  .flag-high { color:#d38b1e !important; background:#fff1dc; border-radius:3px; }
  .flag-normal { color:#2aa5aa !important; background:#e5f6f5; border-radius:3px; }
  .note { font-size:7.5px; color:#66757c; margin-top:7px; }
  .end { text-align:center; font-size:10px; font-weight:800; margin:11px 0 12px; }
  .signatures { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; text-align:center; font-size:7.5px; }
  .sigline { border-top:1px solid #89969b; padding-top:4px; margin-top:17px; font-weight:800; }
  .sigrole { margin-top:3px; font-size:8px; }
  .footer { margin-top:13px; border-top:1px solid #aab8bd; padding-top:5px; font-size:7px; color:#66777d; display:flex; justify-content:space-between; align-items:center; }
  .footerbar { height:15px; margin-top:3px; background:linear-gradient(135deg,#0a6b80 0 20%,#fff 20% 24%,#0a6b80 24% 29%,#fff 29% 34%,#0a6b80 34% 40%,#fff 40% 45%,#0a6b80 45% 100%); position:relative; }
  .footerbar::after { content:""; position:absolute; right:0; top:0; bottom:0; width:28%; background:#31adb0; clip-path:polygon(18% 0,100% 0,100% 100%,0 100%); }
  @media print { body { background:#fff; } .page { margin:0; box-shadow:none; } }
  @media (max-width: 800px) { .page { width:100%; min-height:0; margin:0; padding:20px; } .brand { font-size:20px; } .patient-grid { grid-template-columns:1fr; } .patient,.collection,.barcodebox { border-right:0; border-bottom:1px solid #c5d0d4; padding:10px 0; } }
</style>
</head>
<body>
<div class="page">
  <header class="header">
    <div class="logo"></div>
    <div>
      <div class="brand">${esc(data.brand)} <span>MEDICAL LABORATORY</span></div>
      <div class="subtitle">Final Laboratory Report</div>
      <div class="small">Accuracy Deserve Trust</div>
    </div>
  </header>

  <div class="stripe">
    <div class="left"></div><div class="slashes"></div>
    <div class="right"><b>${esc(data.brand)}</b></div>
  </div>

  <section class="patient-grid">
    <div class="patient">
      <h2>${esc(data.patient.name)}</h2>
      ${data.patient.age && data.patient.age !== '—' ? `<div class="meta">Age : <strong>${esc(data.patient.age)} years</strong></div>` : ''}
      ${data.patient.sex && data.patient.sex !== '—' ? `<div class="meta">Sex : <strong>${esc(data.patient.sex)}</strong></div>` : ''}
      <div class="meta">File Number : <strong>${esc(data.patient.idNumber)}</strong></div>
    </div>
    <div class="collection">
      <strong>Sample Collected At:</strong><br>
      Laboratory<br><br>
      ${data.report.diagnosis && data.report.diagnosis !== '—' ? `<strong>Diagnosis:</strong> ${esc(data.report.diagnosis)}` : ''}
    </div>
    <div class="barcodebox">
      <div class="code">${esc(data.report.requisitionNumber)}</div>
      <div class="dates">
        <strong>Collection Date:</strong> ${esc(data.report.collectionDate)}<br>
        <strong>Request Date:</strong> ${esc(data.report.requestDate)}<br>
        <strong>Report Date:</strong> ${esc(data.report.reportDate)}
      </div>
    </div>
  </section>

  <div class="section-title">${esc(data.report.testsRequested)}</div>
  <div class="section-sub"><span></span><span>${esc(specimenType)} | ${esc(sectionName)} | ${testCount} test(s)</span></div>

  ${summaryCards.length > 0 ? `
  <div class="summary">
    ${summaryHtml}
  </div>
  ` : ''}

  <table>
    <thead>
      <tr>
        <th style="width:43%">INVESTIGATION</th>
        <th style="width:15%">RESULT</th>
        <th style="width:9%">FLAG</th>
        <th style="width:20%">REFERENCE VALUE</th>
        <th style="width:13%">UNIT</th>
      </tr>
    </thead>
    <tbody>
      ${groupRowsHtml}
    </tbody>
  </table>

  ${data.report.comments && data.report.comments !== '—' ? `<div class="note">${esc(data.report.comments)}</div>` : ''}

  <div class="end">****End of Report****</div>

  <div class="signatures">
    <div>
      <div class="sigline">Laboratory</div>
      <div>Verified By</div>
    </div>
    <div>
      <div class="sigline">Pathologist</div>
      <div>Clinical Pathologist</div>
    </div>
    <div>
      <div class="sigline">Authorized Signature</div>
      <div>Laboratory Director</div>
    </div>
  </div>

  <div class="footer">
    <span>Results relate only to the tested samples. Clinical interpretation must be correlated with patient history and physician assessment.</span>
    <span>Generated by RxSoft LIMS</span>
    <span>Page 1 of 1 pages</span>
  </div>
  <div class="footerbar"></div>
</div>
</body>
</html>`;
  }

  async generatePdf(orderId: string): Promise<{ buffer: Buffer; filename: string }> {
    const data = await this.buildReportData(orderId);
    const html = this.renderHtml(data);
    const chromePath =
      process.env.CHROME_PATH ??
      (await this.findChrome()) ??
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

    let puppeteer: any;
    try {
      puppeteer = require('puppeteer-core');
    } catch {
      throw new Error('puppeteer-core is not installed');
    }

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const buffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '12mm', bottom: '14mm', left: '12mm', right: '12mm' },
      });
      return { buffer, filename: `${data.report.requisitionNumber}.pdf` };
    } finally {
      await browser.close();
    }
  }

  private async findChrome(): Promise<string | null> {
    const candidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ];
    const { access } = await import('fs/promises');
    for (const c of candidates) {
      try {
        await access(c);
        return c;
      } catch {
        /* keep trying */
      }
    }
    return null;
  }

  private pickRange(ranges: ReferenceRangeEntity[], gender: string | null, age: number | null): ReferenceRangeEntity | undefined {
    if (!ranges.length) return undefined;
    const byGender =
      gender === 'MALE' || gender === 'FEMALE'
        ? ranges.filter((r) => r.gender === gender)
        : ranges.filter((r) => r.gender === 'DEFAULT');
    const pool = byGender.length ? byGender : ranges;
    const byAge = age != null ? pool.filter((r) => age >= r.minAge && (r.maxAge === 0 || age <= r.maxAge)) : pool;
    return (byAge.length ? byAge : pool)[0];
  }

  private flagFor(value: string, range: ReferenceRangeEntity): ReportRow['flag'] {
    const v = Number(value);
    if (value === '' || Number.isNaN(v)) return '';
    const low = Number(range.lowValue);
    const high = Number(range.highValue);
    if (!Number.isNaN(low) && v < low) return 'Low';
    if (!Number.isNaN(high) && v > high) return 'High';
    return 'Normal';
  }
}
