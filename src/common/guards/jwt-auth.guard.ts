import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { resolveTenantClaims } from '../tenant-context';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      user?: unknown;
    }>();

    if (process.env.SKIP_AUTH === 'true') {
      request.user = resolveTenantClaims(
        {
          sub: 'skip-auth-user',
          organizationId: '00000000-0000-0000-0000-000000000000',
          locationId: null,
          username: 'skip-auth',
          roles: [],
          permissions: [],
        },
        request.headers,
      );
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const rawAuthHeader = request.headers.authorization;
    const authHeader = Array.isArray(rawAuthHeader) ? rawAuthHeader[0] : rawAuthHeader;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authHeader.slice('Bearer '.length);
    // SECURITY: no hardcoded secret fallback — a misconfigured deployment must
    // fail loudly instead of silently verifying tokens with a well-known
    // default. JWT_ACCESS_SECRET must be set in env and shared with identity.
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_ACCESS_SECRET is not configured');
    }
    try {
      const payload = await this.jwtService.verifyAsync<Record<string, any>>(token, { secret });
      // Normalise blank tenant claims and apply the super-admin header
      // overrides so no downstream query receives `organizationId: ""`.
      request.user = resolveTenantClaims(payload, request.headers);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
