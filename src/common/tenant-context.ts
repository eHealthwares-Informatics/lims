import { RequestUser } from './decorators/current-user.decorator';

export interface TenantContext {
  organizationId: string;
  locationId: string | null;
  isGlobalAdmin: boolean;
  userId: string | null;
}

export function tenantFromUser(user: RequestUser): TenantContext {
  return {
    organizationId: user.organizationId,
    locationId: user.locationId ?? null,
    isGlobalAdmin: !user.organizationId,
    userId: user.sub ?? null,
  };
}
