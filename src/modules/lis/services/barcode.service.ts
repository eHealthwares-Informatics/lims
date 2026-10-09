import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bwipjs from 'bwip-js';
import { SampleEntity } from '../entities';
import { Response } from 'express';

@Injectable()
export class BarcodeService {
  constructor(
    @InjectRepository(SampleEntity)
    private readonly sampleRepo: Repository<SampleEntity>,
  ) {}

  /**
   * Generate a barcode PNG buffer for a sample.
   */
  async generateSampleBarcode(sampleId: string): Promise<Buffer> {
    const sample = await this.sampleRepo.findOne({
      where: { id: sampleId, deletedAt: null } as any,
      relations: ['sampleType', 'order'],
    });
    if (!sample) {
      throw new NotFoundException('Sample not found');
    }

    const barcodeText = sample.barcode;
    try {
      const png = await bwipjs.toBuffer({
        bcid: 'code128',       // Barcode type
        text: barcodeText,     // Text to encode
        scale: 3,              // 3x scaling
        height: 10,            // Bar height in mm
        includetext: true,     // Show human-readable text
        textxalign: 'center',  // Text alignment
        backgroundcolor: 'FFFFFF',
      });
      return png;
    } catch (err) {
      throw new Error(`Failed to generate barcode: ${(err as Error).message}`);
    }
  }

  /**
   * Render a printable HTML label for a sample (for browser Print).
   */
  async renderLabelHtml(sampleId: string): Promise<string> {
    const sample = await this.sampleRepo.findOne({
      where: { id: sampleId, deletedAt: null } as any,
      relations: ['sampleType', 'order'],
    });
    if (!sample) {
      throw new NotFoundException('Sample not found');
    }

    const barcodePng = await this.generateSampleBarcode(sampleId);
    const barcodeBase64 = barcodePng.toString('base64');
    const barcodeSrc = `data:image/png;base64,${barcodeBase64}`;

    const labelWidth = 100; // mm
    const labelHeight = 60; // mm

    return `<!DOCTYPE html>
<html>
<head>
  <title>Sample Label - ${sample.barcode}</title>
  <style>
    @page { size: ${labelWidth}mm ${labelHeight}mm; margin: 2mm; }
    body { font-family: Arial, sans-serif; margin: 0; padding: 2mm; width: ${labelWidth - 4}mm; height: ${labelHeight - 4}mm; }
    .label { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }
    .barcode-img { max-width: 90%; margin-bottom: 2mm; }
    .fields { font-size: 10pt; text-align: center; width: 100%; }
    .fields table { width: 100%; border-collapse: collapse; }
    .fields td { padding: 1px 4px; }
    .fields .key { font-weight: bold; text-align: right; width: 40%; }
    .fields .value { text-align: left; }
  </style>
</head>
<body>
  <div class="label">
    <img class="barcode-img" src="${barcodeSrc}" alt="${sample.barcode}" />
    <div class="fields">
      <table>
        <tr><td class="key">Sample:</td><td class="value">${sample.barcode}</td></tr>
        <tr><td class="key">Type:</td><td class="value">${sample.sampleType?.name ?? '-'}</td></tr>
        <tr><td class="key">Order:</td><td class="value">${sample.order?.orderNumber ?? sample.orderId?.slice(0, 8) ?? '-'}</td></tr>
        <tr><td class="key">Date:</td><td class="value">${sample.collectionDate ? new Date(sample.collectionDate).toLocaleDateString() : '-'}</td></tr>
        <tr><td class="key">Collector:</td><td class="value">${sample.collector ?? '-'}</td></tr>
      </table>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Stream a barcode PNG as response.
   */
  async streamBarcode(sampleId: string, res: Response): Promise<void> {
    const png = await this.generateSampleBarcode(sampleId);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="barcode-${sampleId.slice(0, 8)}.png"`,
      'Content-Length': png.length.toString(),
    });
    res.end(png);
  }
}