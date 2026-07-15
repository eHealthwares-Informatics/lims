# RxSoft LIS Backend

Standalone NestJS service for the Laboratory Information System (LIS) module of the RxSoft platform. Handles lab workflows, test ordering, results management, and integrates with the interoperability switch.

Part of the [RxSoft monorepo](https://github.com/anomalyco/rxsoft).

## Stack

| Aspect | Technology |
|---|---|
| Runtime | Node.js |
| Framework | NestJS 11 |
| Database | PostgreSQL (dev) / SQLite (alternative) |
| ORM | TypeORM 0.3 |
| Auth | JWT (shared secret) |
| Scheduler | `@nestjs/schedule` |
| API Docs | Swagger at `/docs` |
| PM | npm |

## Quick Start

```bash
npm install
npm run start:dev
```

The API defaults to **port 8091** (configurable via `PORT`).

## Architecture

Standard NestJS module structure:

- **`lis`** — Core LIS module: lab orders, tests, specimens, results
- **`health`** — Health check endpoint
- **`common`** — Shared guards (`JwtAuthGuard`), decorators (`@CurrentUser`), tenant-context helpers, utilities
- **`database`** — Seeding service and seed scripts
- **`shared`** — DTOs and shared utilities

### Integration Pattern

```
rxsoft-lis-backend ←→ healthcare-interoperability-switch (webhooks)
         ↕
   rxsoft-backend (LIS proxy module)
```

## Commands

| Command | Description |
|---|---|
| `npm run start:dev` | Dev server with watch |
| `npm run start:prod` | Production start |
| `npm run build` | Compile TypeScript |
| `npm run test:integration` | Integration tests (`--runInBand`) |
| `npm run seed` | Run database seeds |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | 8091 | Server port |
| `DB_TYPE` | `postgres` | Database type |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `DB_NAME` | `lis` | Database name |
| `DB_SYNCHRONIZE` | `false` | Auto-create tables |
| `DB_DROP_SCHEMA` | `false` | Drop schema on start |
| `TYPEORM_LOGGING` | `false` | Query logging |
| `SEED_ON_START` | `false` | Seed on startup |
| `JWT_ACCESS_SECRET` | `admin-access-secret` | JWT secret (shared) |
| `INTEROP_API_KEY` | `lis-interop-key-dev` | API key for interoperability switch |
| `INTEROP_SWITCH_WEBHOOK_URL` | `http://localhost:8090/api/v1/flow/messages` | Webhook URL for interop switch |
| `RXSOFT_BACKEND_URL` | `http://localhost:8080` | RxSoft Backend URL |

## Database

PostgreSQL with TypeORM. Uses migration-based schema management (`synchronize: false` by default).

## Patterns

- JWT auth with shared secret (same as rxsoft-backend/rxsoft-identity)
- Tenant scoping via `TenantContext` from JWT payload
- Integration with healthcare-interoperability-switch via webhooks
- Seeding gated by `SEED_ON_START`

## See Also

- [`../BACKEND_SEARCH_ARCHITECTURE.md`](https://github.com/anomalyco/rxsoft/blob/main/BACKEND_SEARCH_ARCHITECTURE.md) — List/search endpoint standards
- [`../AGENTS.md`](https://github.com/anomalyco/rxsoft/blob/main/AGENTS.md) — Monorepo overview
