# Proposal: graphql-field-resolver-space-context

## Intent

GraphQL `@ResolveField` handlers (e.g. `PlantResponseDto.qr`) were returning `null` even when the plant had a linked `qrId`. Tenant-scoped QR reads failed with `SpaceContextMissingException` because field resolvers run after the parent query handler completes, outside the `SpaceInterceptor` ALS frame.

## Root Cause

NestJS GraphQL skips global `APP_GUARD` and `APP_INTERCEPTOR` on field resolvers by default (`fieldResolverEnhancers: []`). The parent query (`plantFindById`) runs inside `SpaceInterceptor` → `SpaceContext.run(spaceId)`, but GraphQL field resolution happens afterward in a separate execution context. `QrTypeOrmReadRepository` (via `createTenantRepository`) calls `SpaceContext.require()` and fails. `PlantQrAdapter` swallows the error with `.catch(() => null)`, so clients see `qr: null` with no explicit error.

## Fix

Enable `fieldResolverEnhancers: ['guards', 'interceptors']` in `GraphQLModule.forRoot()` so `SpaceGuard` and `SpaceInterceptor` re-apply on field resolvers. `req.spaceId` (set during the same GraphQL request) is wrapped again in ALS before tenant repository calls.

## Scope

- `src/app.module.ts` — GraphQL module configuration
- `openspec/specs/spaces/spec.md` — document GraphQL field resolver tenancy contract
- `openspec/specs/plants/spec.md` — clarify `qr` field resolution scenario

## Out of Scope

- Passing `spaceId` manually via `SpaceContext.run()` in adapters or resolvers
- Moving QR enrichment from field resolvers into query handlers (alternative architecture, not chosen)
- Changes to `SpaceGuard`, `SpaceInterceptor`, or `SpaceContext` implementation
