import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type OrganizationScope = 'all' | 'global' | 'org';

export type RequestUser = {
  sub: string;
  organizationId: string;
  locationId: string | null;
  username: string;
  roles: string[];
  permissions: string[];
  organizationScope?: OrganizationScope;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return request.user as RequestUser;
  },
);
