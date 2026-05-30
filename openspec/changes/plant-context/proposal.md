# Proposal: Plant Bounded Context

## Intent

Gardenia is a gardening app, yet there is no way to represent a plant — the
core domain object of the entire product. Three bounded contexts exist
(`auth`, `users`, `spaces`), but none of them models what users actually
manage: their plants. This change introduces `plants` as the fourth bounded
context, giving each space a tenant-scoped catalog of plants that members can
create, read, update, and delete.

Why now: `spaces` (the multi-tenant anchor) and `users` are live and stable,
and the tenancy plumbing (`createTenantRepository` + `SpaceContext` ALS) is
proven. The platform is ready for its first real domain feature, and every
downstream capability (watering tasks, locations, reminders, analytics) depends
on a `Plant` aggregate existing first.

Success looks like: an authenticated, space-scoped user can create a plant with
a name (and optionally species + image URL), list and fetch their space's
plants, and update or delete a plant they own — over BOTH REST and GraphQL —
with strict per-space isolation enforced at the repository layer.

## Scope

### In Scope

- New `plants` bounded context under `src/contexts/plants/` (domain →
  application → infrastructure → transport), following the established DDD +
  CQRS + Hexagonal layering.
- `PlantAggregate` with fields: `name` (required), `species` (optional),
  `imageUrl` (optional), plus the implicit `userId` (owner) and `spaceId`
  (tenant) and `BaseAggregate` timestamps.
- Commands: `CreatePlant`, `UpdatePlant`, `DeletePlant`.
- Queries: `PlantFindById`, `PlantFindByCriteria` (both tenant-scoped).
- Domain events: `PlantCreated`, `PlantUpdated`, `PlantDeleted`.
- DUAL transport — both REST controller AND GraphQL resolvers (queries +
  mutations). This is the first context in the project to expose both.
- TypeORM entity with a non-nullable `spaceId` column, wrapped via
  `createTenantRepository` on both read and write repositories.
- A hand-written migration `{timestamp}-CreatePlants.ts` creating the `plants`
  table.
- Owner-only authorization for `UpdatePlant` / `DeletePlant`, enforced in the
  command handlers.
- Register `PlantsModule` in `AppModule`.

### Out of Scope (explicit)

- **Location module** — `location` field and the `locations` bounded context
  are deferred. Plants will NOT carry a location in this change.
- **Tasks module** — `lastWateredAt`, watering schedules, reminders, and the
  `tasks` bounded context are deferred. No care-schedule fields here.
- **Admin authorization** — "a space admin may modify any plant in the space"
  is a REQUIRED future capability, but the admin/role concept does NOT exist in
  the codebase yet. This change ships OWNER-ONLY mutations. The admin bypass is
  tracked as a separate pending openspec change (see Pending Features).
- Plant-specific domain operations beyond CRUD (e.g. `water-plant`,
  `transplant-plant`, `archive-plant`).
- Per-field granular change events (a single `PlantUpdated` event is
  sufficient; no `PlantNameChanged` / `PlantSpeciesChanged` events).
- Image upload / storage handling — `imageUrl` is a plain string supplied by
  the client; this context does not own file storage.

## Domain Model

### `PlantAggregate` (extends `BaseAggregate`)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `PlantId` (UUID VO) | yes | `UuidValueObject`; generated on create |
| `name` | `PlantName` (String VO) | yes | non-empty, `maxLength` bounded |
| `species` | `PlantSpecies` (String VO) | no | nullable; bounded length |
| `imageUrl` | `PlantImageUrl` (String VO) | no | nullable; bounded length, URL-shaped |
| `userId` | `string` (UUID) | yes | owner — the creating user; used for authz |
| `spaceId` | `string` (UUID) | yes | tenant anchor; injected via `SpaceContext` |
| `createdAt` / `updatedAt` | `Date` | yes | from `BaseAggregate` |

### Value Objects

- `plant-id/plant-id.value-object.ts` — wraps `UuidValueObject`.
- `plant-name/plant-name.value-object.ts` — `StringValueObject`, non-empty,
  bounded length; throws `FieldIsRequiredException` when empty.
- `plant-species/plant-species.value-object.ts` — optional `StringValueObject`.
- `plant-image-url/plant-image-url.value-object.ts` — optional
  `StringValueObject`.

`userId` and `spaceId` are stored as bare UUID strings (consistent with the
codebase's "no TypeORM relations, bare FK columns" convention).

### Domain Events (extend `BaseEvent<TData>`)

- `plant-created/plant-created.event.ts`
- `plant-updated/plant-updated.event.ts`
- `plant-deleted/plant-deleted.event.ts`
- `events/interfaces/plant-event-data.interface.ts`

### Exceptions

- `plant-not-found.exception.ts` — query/command target missing in this space.
- `not-plant-owner.exception.ts` — mutation requested by a non-owner (admin
  bypass NOT yet available; see Pending Features).

### Supporting artifacts

- `PlantBuilder` (`BaseBuilder<PlantAggregate, PlantViewModel>`).
- `PlantViewModel` (`BaseViewModel`) and `PlantPrimitives` (`BasePrimitives`).
- Read/write repository interfaces with Symbol tokens
  (`PLANT_READ_REPOSITORY`, `PLANT_WRITE_REPOSITORY`).

## Commands

| Command | Inputs | Authorization | Behavior |
|---------|--------|---------------|----------|
| `CreatePlant` | `name`, `species?`, `imageUrl?`, `userId` (from `@CurrentUser`) | Any authenticated space member | Builds aggregate with generated `PlantId`, owner = `userId`, `spaceId` from `SpaceContext`; persists; emits `PlantCreated`. Returns new `plantId`. |
| `UpdatePlant` | `plantId`, `name?`, `species?`, `imageUrl?`, `requestingUserId` | **Owner-only** | Loads plant (tenant-scoped); if `plant.userId !== requestingUserId` → `NotPlantOwnerException`; applies changes via `touch()`; emits `PlantUpdated`. |
| `DeletePlant` | `plantId`, `requestingUserId` | **Owner-only** | Loads plant (tenant-scoped); owner check as above; deletes; emits `PlantDeleted`. |

Handlers extend `BaseCommandHandler<TCommand, PlantAggregate>` and call
`publishEvents(aggregate)`. The owner check reads the loaded plant's `userId`
and compares it to `requestingUserId`; on mismatch it throws
`NotPlantOwnerException`. **Note**: when the future `admin-authorization`
feature lands, this check becomes "owner OR space admin" — a single point of
change in each handler.

## Queries

| Query | Inputs | Scope | Returns |
|-------|--------|-------|---------|
| `PlantFindById` | `plantId` | tenant (space) | `PlantViewModel`; throws `PlantNotFoundException` if absent in this space |
| `PlantFindByCriteria` | `Criteria` (pagination/filter/sort) | tenant (space) | `PaginatedResult<PlantViewModel>` |

Both queries resolve through the tenant-wrapped read repository, so a plant in
another space is invisible — there is no need to pass `spaceId` explicitly; the
`SpaceContext` ALS supplies it. An assert-read service
(`assert-plant-view-model-exists`) backs `PlantFindById`.

## Transport (dual — new precedent)

This is the FIRST context to expose both transports. Precedent today:
`spaces` = REST-only, `users` = GraphQL-only. `plants` = both.

### REST (`transport/rest/`)

`PlantsController` (`@Controller('plants')`, `@ApiTags('plants')`,
`@ApiBearerAuth()`), dispatching ONLY via `CommandBus` / `QueryBus`:

| Method | Route | Guards | Body / Params |
|--------|-------|--------|----------------|
| `POST` | `/plants` | `JwtAuthGuard` + `SpaceGuard` | `CreatePlantDto` |
| `GET` | `/plants` | `JwtAuthGuard` + `SpaceGuard` | pagination query → `PlantFindByCriteria` |
| `GET` | `/plants/:id` | `JwtAuthGuard` + `SpaceGuard` | `PlantFindById` |
| `PATCH` | `/plants/:id` | `JwtAuthGuard` + `SpaceGuard` | `UpdatePlantDto` |
| `DELETE` | `/plants/:id` | `JwtAuthGuard` + `SpaceGuard` | — |

`@CurrentUser()` supplies the owner / requesting user. All routes are
space-scoped (require `X-Space-ID`), so NO `@SkipSpace()` is used. DTOs use
`class-validator` + `@ApiProperty`; `PlantRestMapper` maps
`PlantViewModel → PlantRestResponseDto`.

### GraphQL (`transport/graphql/`)

Two resolvers following the `users` pattern, `autoSchemaFile` (no SDL):

- `plant-queries.resolver.ts` — `@Query` `plant(id)` and `plants(criteria)`.
- `plant-mutations.resolver.ts` — `@Mutation` `createPlant`, `updatePlant`,
  `deletePlant`; mutations return the kit's `MutationResponseDto`.

`@InputType` request DTOs + `@ObjectType` response DTOs; paginated response
extends `BasePaginatedResultDto`. Resolvers dispatch via `CommandBus` /
`QueryBus` only. Authentication via `JwtAuthGuard`; space scoping via
`SpaceGuard` / `SpaceContext` as in the REST layer.

Both transports share the SAME application layer (commands, queries, handlers)
and domain — only DTOs, mappers, and the controller/resolver entry points
differ.

## Authorization Model

- **Authentication**: every plant operation requires a valid JWT
  (`JwtAuthGuard`) on both transports.
- **Tenant scoping (reads + writes)**: all repository access is wrapped with
  `createTenantRepository`, so every plant is implicitly filtered by the
  `spaceId` in `SpaceContext`. A user can never read or mutate a plant outside
  their active space. `SpaceGuard` enforces space membership before the handler
  runs.
- **Mutation ownership (owner-only, this change)**: `UpdatePlant` and
  `DeletePlant` additionally require `plant.userId === requestingUserId`,
  enforced in the command handler (NOT in transport — authorization decisions
  stay in the application layer). Mismatch → `NotPlantOwnerException` (403).
- **Reads**: any space member may read any plant in their space (no per-plant
  read ownership), consistent with the shared-space model.
- **MISSING — admin bypass**: the confirmed intent is "owner OR space admin may
  mutate". The space-admin / role concept does NOT exist yet. This change ships
  owner-only; the admin path is a tracked pending feature.

## Pending Features (tracked separately)

A new openspec change MUST be tracked for **`admin-authorization`**:

- Introduce a space-level admin role (likely extending `SpaceMembership` /
  `MembershipRole`).
- Extend the owner-only check in `UpdatePlant` / `DeletePlant` handlers to
  "owner OR space admin".
- Generalize so other contexts can reuse the admin check.

Recommended openspec change id: `admin-authorization`. The `plants` owner-check
handlers are intentionally structured so this becomes a one-line condition
change per handler when that feature lands.

## Architecture Notes

- **Dual transport structure**: `transport/rest/` (controller, dtos, mappers)
  AND `transport/graphql/` (resolvers, request/response dtos, mappers) coexist.
  This differs from `spaces` (rest only) and `users` (graphql only). The module
  registers `controllers: [PlantsController]` AND providers for both resolvers
  and both mapper sets. Any GraphQL enums (none expected initially) would need
  registration in `registered-enums.graphql.ts`.
- **Single shared core**: both transports call the identical CQRS handlers — no
  duplicated business logic. The cost of "both" is only DTOs + mappers +
  entry-point classes, NOT duplicated domain/application code.
- **Persistence**: one PostgreSQL `plants` table serves both read and write
  sides (no separate read model / event store), per the existing convention.
  Read repo `save`/`delete` are no-op stubs.
- **Module**: `imports: [CqrsModule, TypeOrmModule.forFeature([PlantTypeOrmEntity])]`,
  `controllers: [PlantsController]`, providers for command/query handlers,
  builders, mappers, repositories (Symbol-token bound), and both resolvers.
  Added to `AppModule` imports.
- **Migration**: `plants` table with `id` (PK uuid), `name` (not null),
  `species` (nullable), `image_url` (nullable), `user_id` (not null uuid),
  `space_id` (not null uuid), `created_at`, `updated_at`. No FK constraints
  (matches codebase convention of bare UUID columns). Name uniqueness is NOT
  enforced (plants may share names within a space).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tenant scoping gap — forgetting `createTenantRepository` on a repo silently exposes cross-space plants | Med | High (security boundary) | Wrap BOTH read and write repos; add e2e test asserting a plant in space A is invisible from space B |
| `SpaceContext` not set up in tests → all repo calls throw `SpaceContextMissingException` | High | Med | Integration/e2e setup MUST seed `SpaceContext` ALS (and `X-Space-ID`) per the `users`/`spaces` test patterns |
| Migration timestamp collision with concurrent schema branches | Med | Med | Generate the highest unique timestamp; ensure it sorts last among `src/database/migrations/` |
| Dual-transport complexity — REST and GraphQL drift in behavior or validation | Med | Med | Keep ALL logic in shared handlers; transports only map DTOs; mirror validation rules across both DTO sets; test both surfaces |
| Owner-only authz is a partial solution — product wants admin bypass too | High | Med | Explicitly scoped OUT; tracked as `admin-authorization` pending change; handlers structured for a one-line extension |
| `imageUrl` accepted as arbitrary string (no upload/validation pipeline) | Low | Low | String VO with length bound; storage/validation deferred; document as client-supplied |

## Rollback Plan

The context is net-new and additive (no existing files modified except
`AppModule` import). Rollback = revert the branch AND roll back the
`CreatePlants` migration (drop the `plants` table). No other context depends on
`plants` yet, so there are no cascading reverts.

## Success Criteria

- [ ] Authenticated, space-scoped user can create a plant (name required;
      species + imageUrl optional) over BOTH REST and GraphQL.
- [ ] List and fetch-by-id return only plants in the caller's active space.
- [ ] Update/Delete succeed for the owner and are rejected (403 /
      `NotPlantOwnerException`) for non-owners.
- [ ] Cross-space isolation verified by e2e test (space B cannot see space A's
      plants).
- [ ] `PlantsModule` registered in `AppModule`; migration applies cleanly.
- [ ] `admin-authorization` pending change recorded in openspec.
- [ ] Unit + e2e tests green; coverage ≥ 80%.
