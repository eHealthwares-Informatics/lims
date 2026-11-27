import { Controller, Get, Headers } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PatientRecordsService } from '../services/patient-records.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../../common/decorators/current-user.decorator';

/**
 * Lab records as a patient feature of the app.
 *
 * Read-only and scoped to the signed-in caller: the patient is resolved from
 * the token (user id → participant id → phone), never from a client-supplied
 * patient id.
 */
@ApiTags('patient')
@Controller('patient')
export class PatientSelfController {
  constructor(private readonly records: PatientRecordsService) {}

  @Get('records')
  @ApiOperation({ summary: "The caller's own lab results" })
  records_(
    @CurrentUser() user: RequestUser,
    @Headers('x-patient-phone') phone?: string,
    @Headers('x-participant-id') participantId?: string,
  ) {
    return this.records.records({
      userId: user?.sub,
      phone,
      participantId,
    });
  }

  @Get('me')
  @ApiOperation({ summary: 'The patient behind the current token' })
  async me(
    @CurrentUser() user: RequestUser,
    @Headers('x-patient-phone') phone?: string,
    @Headers('x-participant-id') participantId?: string,
  ) {
    const patient = await this.records.resolvePatient({
      userId: user?.sub,
      phone,
      participantId,
    });
    if (!patient) return null;
    return {
      patientId: patient.patientId,
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
    };
  }
}
