import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { BarcodeService } from '../services/barcode.service';

@ApiTags('lis')
@Controller('lis/samples')
export class BarcodeController {
  constructor(private readonly barcode: BarcodeService) {}

  @Get(':id/barcode')
  @ApiOperation({ summary: 'Get barcode PNG image for a sample' })
  async getBarcode(@Param('id') id: string, @Res() res: Response) {
    await this.barcode.streamBarcode(id, res);
  }

  @Get(':id/label')
  @ApiOperation({ summary: 'Get printable HTML label for a sample' })
  async getLabel(@Param('id') id: string, @Res() res: Response) {
    const html = await this.barcode.renderLabelHtml(id);
    res.set({
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="label-${id.slice(0, 8)}.html"`,
    });
    res.end(html);
  }
}