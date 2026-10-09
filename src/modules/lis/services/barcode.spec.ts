import { NotFoundException } from '@nestjs/common';
import { BarcodeService } from './barcode.service';

describe('BarcodeService', () => {
  let service: BarcodeService;
  let sampleRepo: any;

  beforeEach(() => {
    sampleRepo = {
      findOne: jest.fn(),
    };
    service = new BarcodeService(sampleRepo);
  });

  describe('generateSampleBarcode', () => {
    it('should throw when sample not found', async () => {
      sampleRepo.findOne.mockResolvedValue(null);
      await expect(service.generateSampleBarcode('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should generate a PNG buffer for a valid sample', async () => {
      sampleRepo.findOne.mockResolvedValue({
        id: 'sample-1',
        barcode: 'SMP-001',
        sampleType: { name: 'Blood' },
        order: { orderNumber: 'ORD-001' },
      });
      const png = await service.generateSampleBarcode('sample-1');
      expect(png).toBeInstanceOf(Buffer);
      expect(png.length).toBeGreaterThan(100);
      // PNG signature
      expect(png[0]).toBe(0x89);
      expect(png[1]).toBe(0x50); // 'P'
      expect(png[2]).toBe(0x4e); // 'N'
      expect(png[3]).toBe(0x47); // 'G'
    });
  });

  describe('renderLabelHtml', () => {
    it('should throw when sample not found', async () => {
      sampleRepo.findOne.mockResolvedValue(null);
      await expect(service.renderLabelHtml('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('should render HTML with barcode embedded', async () => {
      sampleRepo.findOne.mockResolvedValue({
        id: 'sample-1',
        barcode: 'SMP-001',
        sampleType: { name: 'Blood' },
        order: { orderNumber: 'ORD-001' },
        collectionDate: '2024-01-15',
        collector: 'John Doe',
      });
      const html = await service.renderLabelHtml('sample-1');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('SMP-001');
      expect(html).toContain('Blood');
      expect(html).toContain('ORD-001');
      expect(html).toContain('data:image/png;base64');
      expect(html).toContain('John Doe');
    });
  });
});