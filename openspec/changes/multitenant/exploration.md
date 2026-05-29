# Exploration: Multi-Tenancy for gardenia-api

**Date**: 2026-05-29
**Status**: done

## Current Architecture Summary

gardenia-api is a NestJS application using hexagonal / screaming architecture, CQRS via `@nestjs/cqrs`, TypeORM 1.x with PostgreSQL, and a dual transport layer (REST + GraphQL). Domain split into two bounded contexts: `auth` and `users`.

### Persistence Layer (TypeORM)
- Single PostgreSQL database, single schema (default `public`).
- Three tables: `accounts`, `users`, `auth_sessions`.
- No `tenantId` column exists on any entity. No FK relationship between `accounts` and `users` at DB level — linked only by application-level `userId` UUID on `AccountEntity`.
- `synchronize: false`, migrations managed manually under `src/database/migrations/`.
- Connection configured once globally in `AppModule` via `TypeOrmModule.forRootAsync`.

### Authentication
- JWT issued by `TokenService.sign(userId, email)` — payload is `{ sub: userId, email }`.
- No `tenantId` in the JWT payload.
- `JwtStrategy.validate` returns `{ userId, email }` — matches `CurrentUserPayload` interface exactly.

### Repositories
- Two repository types per aggregate: read (`IBaseReadRepository<ViewModel>`) and write (`IBaseWriteRepository<Aggregate>`), resolved via DI tokens.
- All queries are bare TypeORM `findOne` / `findAndCount` with no tenant scope.

**No multi-tenancy infrastructure exists today. The codebase is greenfield from a tenant perspective.**

---

## Impact Map

| File / Layer | Change Needed |
|---|---|
| `src/contexts/auth/infrastructure/persistence/typeorm/account.entity.ts` | Add `tenantId` column |
| `src/contexts/users/infrastructure/persistence/typeorm/entities/user.entity.ts` | Add `tenantId` column |
| `src/contexts/auth/infrastructure/persistence/typeorm/auth-session.entity.ts` | Add `tenantId` column |
| All `*-typeorm-read.repository.ts` | Inject tenant filter in every query |
| All `*-typeorm-write.repository.ts` | Inject tenant filter in every query |
| `src/contexts/auth/infrastructure/strategies/jwt.strategy.ts` | Propagate `tenantId` in validated payload |
| `src/contexts/auth/application/services/token.service.ts` | Embed `tenantId` in `sign()` |
| `src/contexts/auth/infrastructure/decorators/current-user.decorator.ts` | `CurrentUserPayload` exposes `tenantId` |
| `src/app.module.ts` / `src/core/config/postgres.config.ts` | Tenant context provider registration |
| `src/database/migrations/` | Additive migrations: ALTER TABLE + composite indexes |
| Transport resolvers / controllers | Extract `tenantId` from JWT and forward |

---

## Multi-Tenancy Strategy Comparison

### 1. Row-Level Security — `tenantId` column (Recommended)
Add `tenantId` UUID to all tables. Repositories add `WHERE tenant_id = ?`. Tenant context threaded via `AsyncLocalStorage`-backed service.

**Pros**: Lowest operational complexity. Existing migration toolchain unchanged. Single DB connection pool. Cross-tenant analytics trivial. Compatible with current `TypeOrmModule.forRootAsync`.

**Cons**: Silent data-leak if a query misses the filter. Every entity and repository must be touched. Unique constraints must become composite `(tenantId, email)` / `(tenantId, username)`.

**Effort**: Medium

### 2. Schema-per-Tenant
One PostgreSQL schema per tenant, `SET search_path` at request time.

**Pros**: Strong isolation. No `tenantId` column pollution. Unique constraints work naturally.

**Cons**: TypeORM 1.x has no first-class schema-switching. Migrations must run per schema. Connection pooling complicated. New tenant bootstrap requires DDL execution.

**Effort**: High

### 3. Database-per-Tenant
Dedicated DB per tenant, runtime DataSource registry.

**Pros**: Maximum isolation.

**Cons**: Fights NestJS `TypeOrmModule` design. Connection pool explosion. Full migrations per tenant DB. Very high operational burden.

**Effort**: Very High

---

## Recommended Approach

**Row-Level Security via `AsyncLocalStorage` tenant context + `BaseTenantRepository` mixin.**

**Reasoning**: The codebase is v0.5.3-alpha with 3 tables and 2 bounded contexts. The hexagonal architecture makes RLS clean: tenant filtering belongs exclusively in the infrastructure layer (repositories), which is already separated from domain. Domain aggregates, commands, queries, and events stay untouched. Migrations are additive.

**Concrete implementation path**:
1. Create `TenantContext` service backed by `AsyncLocalStorage` — global `REQUEST`-scoped provider.
2. Add `TenantGuard`/middleware that extracts `tenantId` from JWT and stores in `TenantContext`.
3. Add `tenantId` column to all 3 entities; make unique constraints composite.
4. Create `BaseTenantRepository` mixin: wraps every `findOne` / `findAndCount` / `save` / `delete` to inject `{ tenantId }` from `TenantContext`.
5. `TokenService.sign()` adds `tenantId` to JWT; `JwtStrategy.validate()` returns it; `CurrentUserPayload` exposes it.

Schema-per-tenant only warranted if GDPR data residency or HIPAA isolation is a hard requirement. Premature for an alpha garden/plant manager.

---

## Migration Complexity

- **Risk**: Medium
- All migrations are additive (ALTER TABLE ADD COLUMN, DROP UNIQUE, ADD UNIQUE(tenantId, col)).
- Existing rows have no `tenantId` — migration must set a default (e.g. `DEFAULT '<system-tenant-uuid>'` or nullable + backfill).
- Changing `email UNIQUE` → `(tenantId, email) UNIQUE` and `username UNIQUE` → `(tenantId, username) UNIQUE` requires dropping and recreating indexes.

---

## Risks

- **Leaky queries**: Any new repository method that bypasses `BaseTenantRepository` silently exposes cross-tenant data. Mitigate with a custom ESLint rule or integration test that asserts tenant isolation.
- **JWT payload bloat**: Adding `tenantId` is fine (UUID = 16 bytes) but establishes a precedent. Guard against future additions to JWT payload.
- **Existing data**: Current rows have no tenant. Migration strategy for legacy data must be decided (system tenant vs discard).
- **Unique constraint drift**: `accounts.email` and `users.username` are globally unique today — changing to composite is a destructive schema change.
- **`nestjs-kit` base classes**: `BaseDatabaseRepository`, `IBaseReadRepository`, `IBaseWriteRepository` come from `@sisques-labs/nestjs-kit`. If they seal the query builder, extending via mixin may require wrapping instead.
- **TypeORM version**: `"typeorm": "^1.0.0"` is an unusual pin — TypeORM 1.x does not exist publicly. Likely resolves to 0.3.x or a private fork. Verify before assuming migration and schema tooling behaviour.

---

## Open Questions

1. **What defines a tenant?** Organisation, workspace, or is each user their own tenant? Determines whether `tenantId` is created at registration or a separate onboarding flow.
2. **Legacy data strategy**: Migrate existing alpha rows into a default "system" tenant, or treat as pre-multitenancy legacy to discard?
3. **Tenant resolution vector**: JWT-embedded `tenantId` (simplest), subdomain-based (`acme.gardenia.app`), or custom header (`X-Tenant-ID`)?
4. **Cross-tenant admin**: Is there a super-admin role that queries across all tenants? If yes, `TenantContext` needs a bypass mode.
5. **`nestjs-kit` extensibility**: Can `BaseDatabaseRepository` be subclassed to inject tenant-aware query conditions, or does it seal the query builder?
6. **Regulatory requirements**: Any GDPR / data residency / SOC2 that would invalidate row-level isolation?

---

## Conclusion

Ready for proposal. Recommended approach (row-level multi-tenancy via `AsyncLocalStorage` tenant context + repository mixin) maps cleanly to the existing hexagonal architecture. The 6 open questions above must be answered in the proposal phase before moving to spec.
