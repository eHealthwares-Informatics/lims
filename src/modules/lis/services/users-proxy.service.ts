import { Injectable } from '@nestjs/common';
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
export class UsersProxyService {
  private readonly cache = new ProxyCache();

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get baseUrl(): string {
    return this.config.get<string>('RXSOFT_BACKEND_URL', 'http://localhost:8080');
  }

  private cacheKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.join(':')}`;
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
}
