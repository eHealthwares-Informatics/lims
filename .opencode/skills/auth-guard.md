# Auth Guard — rxsoft-lis-backend

## Purpose

Add or modify auth on LIS endpoints.

## When to invoke

When creating new endpoints or modifying auth behavior.

## Workflow

1. Global `JwtAuthGuard` is already in place via `APP_GUARD`. Use `@Public()` decorator for opt-out (health endpoint).
2. For the interop endpoint, use `ApiKeyGuard` checking `x-api-key` against `INTEROP_API_KEY`.
3. Use `@CurrentUser()` decorator to extract user context (sub, organizationId, locationId, username, roles, permissions).
4. Permission-based access via `PermissionsGuard` and `@Permissions()` exists but is not global — apply per-controller as needed.

## Refactoring

This package has the most complete auth setup of all backends (global JWT, API key for interop, permission guards available). No major refactoring needed — just ensure new endpoints follow the existing pattern.