import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

class ProxyCache {
  private store = new Map<string, { value: any; expiresAt: number }>();

  get(key: string): any | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key: string, value: any, ttlSeconds: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

@Injectable()
export class UsersProxyService implements OnApplicationBootstrap {
  private readonly cache = new ProxyCache();
  private readonly logger = new Logger(UsersProxyService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get baseUrl(): string {
    return this.config.get<string>('IDENTITY_SERVICE_URL', 'https://api.ehealthwares.com/identity');
  }

  private get internalApiKey(): string {
    return this.config.get<string>('INTERNAL_API_KEY', 'rxsoft-internal-key');
  }

  private cacheKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
  }

  async onApplicationBootstrap(): Promise<void> {
    // Never hold up app bootstrap on the identity service: fire-and-warm with
    // a bounded timeout so tests / offline environments start instantly.
    this.warmUserCache();
  }

  private async warmUserCache(): Promise<void> {
    try {
      const { data } = await firstValueFrom(
        this.http.get(`${this.baseUrl}/users`, {
          headers: { 'x-api-key': this.internalApiKey },
          params: { limit: '1000' },
          timeout: 10_000,
        }),
      );
      const users = Array.isArray(data) ? data : data?.data ?? [];
      for (const user of users) {
        const key = this.cacheKey('users-findOne', user.id);
        this.cache.set(key, user, 600);
      }
      this.logger.log(`Cached ${users.length} users at startup`);
    } catch (err: any) {
      this.logger.warn(`Failed to cache users at startup: ${err.message}`);
    }
  }

  async list(token: string, query?: Record<string, string>): Promise<any> {
    const key = this.cacheKey('users-list', token.slice(-12), JSON.stringify(query ?? {}));
    const cached = this.cache.get(key);
    if (cached) return cached;

    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: query ?? {},
      }),
    );
    this.cache.set(key, data, 30);
    return data;
  }

  async findOne(token: string, id: string): Promise<any> {
    const key = this.cacheKey('users-findOne', id);
    const cached = this.cache.get(key);
    if (cached) return cached;

    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );
    this.cache.set(key, data, 60);
    return data;
  }

  async findById(organizationId: string, userId: string): Promise<any> {
    const key = this.cacheKey('users-findOne', userId);
    const cached = this.cache.get(key);
    if (cached) return cached;

    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/users/${userId}`, {
        headers: { 'x-api-key': this.internalApiKey },
        params: { organizationId },
      }),
    );
    this.cache.set(key, data, 300);
    return data;
  }

  async listOrgUsers(organizationId: string): Promise<any[]> {
    const key = this.cacheKey('org-users', organizationId);
    const cached = this.cache.get(key);
    if (cached) return cached;

    const { data } = await firstValueFrom(
      this.http.get(`${this.baseUrl}/users`, {
        headers: { 'x-api-key': this.internalApiKey },
        params: { organizationId, limit: '1000' },
      }),
    );
    const users = Array.isArray(data) ? data : data?.data ?? [];
    this.cache.set(key, users, 300);
    for (const user of users) {
      this.cache.set(this.cacheKey('users-findOne', user.id), user, 300);
    }
    return users;
  }
}
