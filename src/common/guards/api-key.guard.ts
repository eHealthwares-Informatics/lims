import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const expected = this.configService.get<string>('INTEROP_API_KEY', '');
    if (!apiKey || apiKey !== expected) {
      throw new UnauthorizedException('Invalid or missing API key');
    }
    return true;
  }
}
