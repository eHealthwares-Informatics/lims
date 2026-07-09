import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Public } from '../../../common/decorators/public.decorator';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { LoincEntity, TestDefinitionEntity } from '../entities';
import { OrdersService } from '../services/orders.service';
import { CreateInteropOrderDto } from '../dto/lis-interop.dto';

@ApiTags('lis-interop')
@Controller('lis/interop')
@UseGuards(ApiKeyGuard)
export class LisInteropController {
  constructor(
    @InjectRepository(LoincEntity) private readonly loincRepo: Repository<LoincEntity>,
    @InjectRepository(TestDefinitionEntity) private readonly testDefRepo: Repository<TestDefinitionEntity>,
    private readonly orders: OrdersService,
  ) {}

  @Post('order')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive an interop order from the healthcare switch' })
  async receiveOrder(@Body() dto: CreateInteropOrderDto) {
    const items: Array<{ testDefinitionId: string; notes?: string }> = [];
    for (const item of dto.items) {
      const loinc = await this.loincRepo.findOne({ where: { code: item.loincCode } as any });
      if (!loinc) {
        continue;
      }
      const testDef = await this.testDefRepo.findOne({ where: { loincId: loinc.id, active: true, deletedAt: null } as any });
      if (!testDef) {
        continue;
      }
      items.push({ testDefinitionId: testDef.id, notes: item.notes });
    }

    if (!items.length) {
      return { ok: false, message: 'No valid LOINC codes matched any test definitions' };
    }

    const order = await this.orders.create({
      patientId: dto.patient.patientId,
      patientName: `${dto.patient.firstName} ${dto.patient.lastName}`.trim(),
      patientGender: dto.patient.gender,
      patientDateOfBirth: dto.patient.dateOfBirth,
      items,
      notes: dto.notes,
    });

    return {
      ok: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        itemCount: items.length,
      },
    };
  }
}
