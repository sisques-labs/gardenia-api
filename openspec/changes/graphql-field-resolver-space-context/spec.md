# Spec: graphql-field-resolver-space-context

## Requirements

### R-1 — Field resolvers inherit tenancy guards and interceptors

`GraphQLModule.forRoot()` MUST configure `fieldResolverEnhancers` to include `'guards'` and `'interceptors'` so global `SpaceGuard` and `SpaceInterceptor` run on `@ResolveField` handlers.

### R-2 — Tenant repos work in field resolvers

When a GraphQL field resolver triggers a tenant-scoped repository call (e.g. `PlantQrResolvedFieldResolver` → `IPlantQrPort` → `QrTypeOrmReadRepository`), `SpaceContext.require()` MUST succeed without manual `SpaceContext.run()` in the resolver or adapter.

### R-3 — Plant QR field returns data when linked

When a plant has a valid `qrId` and the client requests the `qr` field, the GraphQL response MUST include the nested `PlantQrResponseDto` with all fields populated.

## Acceptance Scenarios

**S-1**: `plantFindById` with `qr` selection returns `qr.id`, `qr.targetUrl`, `qr.image` when `qrId` is set — no `SpaceContextMissingException` in logs.

**S-2**: `plantsFindByCriteria` with `qr` selection returns populated `qr` on each item with a linked QR.

**S-3**: Build (`pnpm build`) and unit tests (`pnpm test`) pass after the configuration change.
