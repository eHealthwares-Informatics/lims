import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class SendReportDto {
  @IsIn(['whatsapp', 'sms', 'email'])
  via!: 'whatsapp' | 'sms' | 'email';

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
