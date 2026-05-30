# Design: Plant Bounded Context

> Technical design for the `plants` bounded context — the first context with DUAL transport (REST + GraphQL). Mirrors `spaces` (REST patterns) and `users` (GraphQL + tenant-scoped persistence). All architectural decisions below are grounded in existing, proven patterns in the codebase.

---

## 1. Approach Summary

`plants` is a net-new, additive bounded context following the established DDD + CQRS + Hexagonal layering already used by `auth`, `users`, and `spaces`. The decision is to **compose existing patterns rather than invent new ones**:

- **Domain/Application layers** copy the `spaces` aggregate shape (single VO-backed aggregate with `create`/`update`/`delete` emitting whole-aggregate events) — NOT the per-field-change event explosion of `users`. The proposal mandates a single `PlantUpdated` event, so the simpler `spaces` style wins.
- **Persistence** copies `users` exactly: both read and write repos wrap their raw TypeORM repository with `createTenantRepository(rawRepo, spaceContext)` so every query is silently scoped to the active `spaceId` from the `SpaceContext` ALS. This is the load-bearing tenancy guarantee.
- **REST transport** copies `spaces` (`@Controller`, `CommandBus`/`QueryBus` dispatch, `@CurrentUser`, class-validator DTOs, `@ApiProperty`).
- **GraphQL transport** copies `users` (`@Resolver`, `@InputType`/`@ObjectType`, `MutationResponseDto`, `BasePaginatedResultDto`).
- **Authorization**: tenant scoping at the repo layer (read + write); owner-only check for Update/Delete lives **inside the command handler** (never in transport), as a single `if (plant.userId !== requestingUserId) throw new NotPlantOwnerException(...)`. This is the one-line hook for the future `admin-authorization` change.

The cost of dual transport is purely DTOs + mappers + entry classes; the domain and application core is shared verbatim between both surfaces.

### Two non-obvious gotchas this design accounts for

1. **`BaseExceptionFilter` uses an explicit `instanceof` chain** (`src/core/filters/base-exception.filter.ts`). `BaseException` from the kit is a plain `Error` with NO status code. `PlantNotFoundException` and `NotPlantOwnerException` will default to HTTP 400 unless they are explicitly registered in `resolveStatus()`. **The design adds them to the existing NOT_FOUND (404) and FORBIDDEN (403) branches.** Missing this is the single most likely way to ship wrong status codes.
2. **`SpaceContext` is `@Global()`** (exported from `SharedModule`). Unlike `SpacesModule` (which redundantly re-declares `SpaceContext` as a provider), `PlantsModule` does **NOT** need to provide it — it is injectable everywhere already. Cleaner module, fewer provider lines.

---

## 2. File Tree

All paths relative to repo root. `*` marks new files.

```
src/contexts/plants/
├── domain/
│   ├── aggregates/
│   │   └── plant.aggregate.ts                                    *
│   ├── builders/
│   │   └── plant.builder.ts                                      *
│   ├── interfaces/
│   │   └── plant.interface.ts                                    *   (IPlant — VO-typed constructor props)
│   ├── primitives/
│   │   └── plant.primitives.ts                                   *   (IPlantPrimitives extends BasePrimitives)
│   ├── view-models/
│   │   └── plant.view-model.ts                                   *   (PlantViewModel extends BaseViewModel)
│   ├── value-objects/
│   │   ├── plant-id/
│   │   │   └── plant-id.value-object.ts                          *
│   │   ├── plant-name/
│   │   │   └── plant-name.value-object.ts                        *
│   │   ├── plant-species/
│   │   │   └── plant-species.value-object.ts                     *
│   │   └── plant-image-url/
│   │       └── plant-image-url.value-object.ts                   *
│   ├── events/
│   │   ├── interfaces/
│   │   │   └── plant-event-data.interface.ts                     *
│   │   ├── plant-created/
│   │   │   └── plant-created.event.ts                            *
│   │   ├── plant-updated/
│   │   │   └── plant-updated.event.ts                            *
│   │   └── plant-deleted/
│   │       └── plant-deleted.event.ts                            *
│   ├── exceptions/
│   │   ├── plant-not-found.exception.ts                          *
│   │   └── not-plant-owner.exception.ts                          *
│   └── repositories/
│       ├── read/
│       │   └── plant-read.repository.ts                          *   (IPlantReadRepository + PLANT_READ_REPOSITORY)
│       └── write/
│           └── plant-write.repository.ts                         *   (IPlantWriteRepository + PLANT_WRITE_REPOSITORY)
├── application/
│   ├── commands/
│   │   ├── create-plant/
│   │   │   ├── create-plant.command.ts                           *
│   │   │   └── create-plant.handler.ts                           *
│   │   ├── update-plant/
│   │   │   ├── update-plant.command.ts                           *
│   │   │   └── update-plant.handler.ts                           *
│   │   └── delete-plant/
│   │       ├── delete-plant.command.ts                           *
│   │       └── delete-plant.handler.ts                           *
│   ├── queries/
│   │   ├── plant-find-by-id/
│   │   │   ├── plant-find-by-id.query.ts                         *
│   │   │   └── plant-find-by-id.handler.ts                       *
│   │   └── plant-find-by-criteria/
│   │       ├── plant-find-by-criteria.query.ts                   *
│   │       └── plant-find-by-criteria.handler.ts                 *
│   └── services/
│       ├── read/
│       │   └── assert-plant-view-model-exists/
│       │       └── assert-plant-view-model-exists.service.ts     *
│       └── write/
│           └── assert-plant-exists/
│               └── assert-plant-exists.service.ts                *
├── infrastructure/
│   └── persistence/
│       └── typeorm/
│           ├── entities/
│           │   └── plant.entity.ts                               *   (PlantTypeOrmEntity, @Entity('plants'))
│           ├── mappers/
│           │   └── plant-typeorm.mapper.ts                       *
│           └── repositories/
│               ├── plant-typeorm-read.repository.ts              *
│               └── plant-typeorm-write.repository.ts             *
├── transport/
│   ├── rest/
│   │   ├── controllers/
│   │   │   └── plants.controller.ts                              *
│   │   ├── dtos/
│   │   │   ├── create-plant.dto.ts                               *
│   │   │   ├── update-plant.dto.ts                               *
│   │   │   └── plant-rest-response.dto.ts                        *
│   │   └── mappers/
│   │       └── plant/
│   │           └── plant.mapper.ts                               *   (PlantRestMapper)
│   └── graphql/
│       ├── resolvers/
│       │   └── plant/
│       │       ├── plant-queries.resolver.ts                     *
│       │       └── plant-mutations.resolver.ts                   *
│       ├── dtos/
│       │   ├── requests/
│       │   │   └── plant/
│       │   │       ├── create-plant.request.dto.ts               *
│       │   │       ├── update-plant.request.dto.ts               *
│       │   │       ├── delete-plant.request.dto.ts               *
│       │   │       ├── plant-find-by-id.request.dto.ts           *
│       │   │       └── plant-find-by-criteria.request.dto.ts     *
│       │   └── responses/
│       │       └── plant/
│       │           └── plant.response.dto.ts                     *   (PlantResponseDto + PaginatedPlantResultDto)
│       ├── mappers/
│       │   └── plant/
│       │       └── plant.mapper.ts                               *   (PlantGraphQLMapper)
│       └── enums/
│           └── plant/
│               └── plant-registered-enums.graphql.ts             *   (empty scaffold — see §6)
└── plants.module.ts                                             *

src/database/migrations/
└── 1780000000005-CreatePlants.ts                                *   (next timestamp after AddSpaceIdToUsers ...004)

src/app.module.ts                                                MODIFIED (add PlantsModule to imports[])
src/core/filters/base-exception.filter.ts                        MODIFIED (register Plant exceptions — see §3.6)
```

---

## 3. Domain Layer Design

### 3.1 `PlantAggregate` (extends `BaseAggregate`)

Mirrors `SpaceAggregate` (whole-aggregate events) — NOT the per-field `UserAggregate` style.

**Fields (private):**
- `_id: PlantIdValueObject` (readonly)
- `_name: PlantNameValueObject`
- `_species: PlantSpeciesValueObject | null`
- `_imageUrl: PlantImageUrlValueObject | null`
- `_userId: string` (readonly — owner UUID, used for authz)
- `_spaceId: string` (readonly — tenant UUID)
- (timestamps via `super(createdAt, updatedAt)`)

**Constructor:** `constructor(props: IPlant)` — assigns all VOs/fields, calls `super(props.createdAt, props.updatedAt)`.

**`create(): void`** — emits `PlantCreatedEvent` with metadata `{ aggregateRootId/entityId = id.value, aggregateRootType/entityType/eventType = PlantAggregate.name / PlantCreatedEvent.name }` and data `this.toPrimitives()`.

**`update(props: { name?: PlantNameValueObject; species?: PlantSpeciesValueObject | null; imageUrl?: PlantImageUrlValueObject | null }): void`**
- Reassigns each provided field (`!== undefined` check so explicit `null` clears optional fields, mirroring `UserAggregate.changeFirstName`'s `undefined` guard).
- `this.touch()` (updates `updatedAt`).
- Emits a **single** `PlantUpdatedEvent` with `this.toPrimitives()` (no per-field events — proposal mandate).

**`delete(): void`** — emits `PlantDeletedEvent` with `this.toPrimitives()`. Same shape as `UserAggregate.delete()`.

**`toPrimitives(): IPlantPrimitives`** — returns `{ id, name, species, imageUrl, userId, spaceId, createdAt, updatedAt }` (VOs unwrapped via `.value`; optional VOs → `this._species?.value ?? null`).

**Getters:** `id`, `name`, `species`, `imageUrl`, `userId`, `spaceId` (the `userId` getter is what the handler reads for the owner check).

> **Why expose `userId`/`spaceId` as plain string getters:** the owner check in the handler compares `plant.userId === requestingUserId` (string equality, exactly like `SpaceAggregate.ownerId` getter returning `string`).

### 3.2 Value Objects

| VO | Base | Rules |
|----|------|-------|
| `PlantIdValueObject` | `extends UuidValueObject` | one-liner, identical to `SpaceIdValueObject` |
| `PlantNameValueObject` | `extends StringValueObject` | `MAX_LENGTH = 100`, `{ maxLength: 100, allowEmpty: false }` — copy of `SpaceNameValueObject` |
| `PlantSpeciesValueObject` | `extends StringValueObject` | `MAX_LENGTH = 200`, `{ maxLength: 200, allowEmpty: false }` — only ever instantiated when a value is present; absence is `null` at the aggregate level |
| `PlantImageUrlValueObject` | `extends StringValueObject` | `MAX_LENGTH = 500`, `{ maxLength: 500, allowEmpty: false }` — same optional-handling rule |

> **Optional VO handling decision:** the codebase has two precedents — `users` stores nullable fields as raw `string | null` (no VO), `spaces` wraps everything. The proposal explicitly names `PlantSpecies`/`PlantImageUrl` as VOs. Resolution: **define the VOs, but the aggregate holds `VO | null`** and only constructs the VO when a non-null value exists. The builder/command translate `undefined`/`null` inputs to `null`, and a present string to `new PlantSpeciesValueObject(value)`. This keeps validation (length bound) on the VO while honoring optionality. `allowEmpty: false` is safe because we never build a VO from an empty string — empty/missing → `null`.

### 3.3 `IPlantPrimitives` (`primitives/plant.primitives.ts`)

```ts
export type IPlantPrimitives = BasePrimitives & {
  name: string;
  species: string | null;
  imageUrl: string | null;
  userId: string;
  spaceId: string;
};
```
(`BasePrimitives` already supplies `id`, `createdAt`, `updatedAt`.)

### 3.4 `IPlant` (`interfaces/plant.interface.ts`)

VO-typed constructor contract (mirrors `ISpace`):
```ts
export interface IPlant {
  id: PlantIdValueObject;
  name: PlantNameValueObject;
  species: PlantSpeciesValueObject | null;
  imageUrl: PlantImageUrlValueObject | null;
  userId: string;
  spaceId: string;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
```

### 3.5 `PlantViewModel` (extends `BaseViewModel`)

Mirrors `SpaceViewModel`. Read-only public fields constructed from `IPlantPrimitives`:
```ts
export class PlantViewModel extends BaseViewModel {
  public readonly name: string;
  public readonly species: string | null;
  public readonly imageUrl: string | null;
  public readonly userId: string;
  public readonly spaceId: string;
  constructor(props: IPlantPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name; this.species = props.species;
    this.imageUrl = props.imageUrl; this.userId = props.userId;
    this.spaceId = props.spaceId;
  }
}
```

### 3.6 `PlantBuilder` (`@Injectable`, extends `BaseBuilder<PlantAggregate, PlantViewModel>`)

Mirrors `SpaceBuilder`. Fluent setters `withName`, `withSpecies`, `withImageUrl`, `withUserId`, `withSpaceId` (plus inherited `withId`/`withCreatedAt`/`withUpdatedAt`).
- `build()`: `validate()` then `new PlantAggregate({ id: new PlantIdValueObject(this._id), name: new PlantNameValueObject(this._name), species: this._species != null ? new PlantSpeciesValueObject(this._species) : null, imageUrl: this._imageUrl != null ? new PlantImageUrlValueObject(this._imageUrl) : null, userId: this._userId, spaceId: this._spaceId, createdAt: new DateValueObject(this._createdAt), updatedAt: new DateValueObject(this._updatedAt) })`.
- `buildViewModel()`: `validate()` then `new PlantViewModel({ id, name, species, imageUrl, userId, spaceId, createdAt, updatedAt })`.
- `validate()`: `super.validate()` + require `name`, `userId`, `spaceId` via `FieldIsRequiredException`. `species`/`imageUrl` are NOT required.

> Used both by command handlers (to build aggregates) and by the TypeORM mapper (to rehydrate aggregates and view models from entities) — exactly the `SpaceBuilder`/`UserBuilder` dual role.

### 3.7 Domain Events

All extend `BaseEvent<TData>` (kit), identical thin-wrapper shape as `SpaceCreatedEvent`.

**`plant-event-data.interface.ts`** — single payload interface reused by all three events (proposal: single `PlantUpdated`, full snapshot):
```ts
export interface IPlantEventData {
  id: string;
  name: string;
  species: string | null;
  imageUrl: string | null;
  userId: string;
  spaceId: string;
  createdAt: Date;
  updatedAt: Date;
}
```
> This is structurally identical to `IPlantPrimitives` (string-unwrapped). `toPrimitives()` is the data passed to every event — so all three events (`PlantCreatedEvent`, `PlantUpdatedEvent`, `PlantDeletedEvent`) carry the **full plant snapshot**. No partial/diff payloads.

### 3.8 Exceptions

Both extend `BaseException` (plain `Error` from kit — NO inherent status code).

- `PlantNotFoundException` — `constructor(id: string)` → `super(\`Plant with id '${id}' was not found\`)`. Copy of `SpaceNotFoundException`.
- `NotPlantOwnerException` — `constructor(userId: string, plantId: string)` → `super(\`User '${userId}' is not the owner of plant '${plantId}'\`)`. Copy of `NotSpaceOwnerException`.

**MANDATORY filter wiring** (`src/core/filters/base-exception.filter.ts` — MODIFIED):
- Add `PlantNotFoundException` to the existing `instanceof` group that returns `HttpStatus.NOT_FOUND` (404).
- Add `NotPlantOwnerException` to the group that returns `HttpStatus.FORBIDDEN` (403).
- Add the two imports at the top.

> Without this edit, both exceptions silently fall through to the `BAD_REQUEST` (400) default. This applies to BOTH REST and GraphQL because the filter implements `ExceptionFilter` AND `GqlExceptionFilter`.

### 3.9 Repository Interfaces (with Symbol tokens)

**`repositories/read/plant-read.repository.ts`:**
```ts
export const PLANT_READ_REPOSITORY = Symbol('PLANT_READ_REPOSITORY');
export type IPlantReadRepository = IBaseReadRepository<PlantViewModel>;
```
(No extra methods — `findById` + `findByCriteria` from the kit base interface suffice. Cleaner than `ISpaceReadRepository` which added `findByMember`.)

**`repositories/write/plant-write.repository.ts`:**
```ts
export const PLANT_WRITE_REPOSITORY = Symbol('PLANT_WRITE_REPOSITORY');
export type IPlantWriteRepository = IBaseWriteRepository<PlantAggregate>;
```
Copy of `ISpaceWriteRepository`/`IUserWriteRepository` shape.

---

## 4. Application Layer Design

### 4.1 `CreatePlantCommand` + `CreatePlantCommandHandler`

**Command inputs** (`CreatePlantCommandInput`): `{ name: string; species?: string | null; imageUrl?: string | null; userId: string }`. Constructor wraps `name` in `PlantNameValueObject`, `userId` in `UuidValueObject`; species/imageUrl held as raw `string | null` (the builder wraps them). Mirrors `CreateSpaceCommand`.

> `spaceId` is NOT a command input — it comes from `SpaceContext` via the tenant repo at save time. The handler never sees it explicitly. This is the tenancy contract.

**Handler** (`extends BaseCommandHandler<CreatePlantCommand, PlantAggregate>`, `implements ICommandHandler<CreatePlantCommand, string>`):
1. `const now = new Date()`
2. Build aggregate via `this.plantBuilder.withId(UuidValueObject.generate().value).withName(...).withSpecies(...).withImageUrl(...).withUserId(command.userId.value).withSpaceId(<placeholder>).withCreatedAt(now).withUpdatedAt(now).build()`.
   - **`spaceId` decision:** the builder requires `spaceId` (for VM completeness), but the authoritative tenant scoping happens in `createTenantRepository.save()` which **overwrites** `spaceId` with `ctx.require()` (see the factory's `save` proxy). So the handler may pass `SpaceContext.require()` (inject `SpaceContext`) to keep the in-memory aggregate consistent with what gets persisted. **Inject `SpaceContext` into the handler** and call `withSpaceId(this.spaceContext.require())`.
3. `plant.create()` (queues `PlantCreatedEvent`).
4. `await this.plantWriteRepository.save(plant)` — tenant repo stamps `spaceId`.
5. `await this.publishEvents(plant)`.
6. `return plant.id.value` (string).

Dependencies: `@Inject(PLANT_WRITE_REPOSITORY) plantWriteRepository`, `PlantBuilder`, `SpaceContext`, `EventBus`.

### 4.2 `UpdatePlantCommand` + `UpdatePlantCommandHandler`

**Inputs:** `{ plantId: string; name?: string; species?: string | null; imageUrl?: string | null; requestingUserId: string }`. Command holds `plantId` as `PlantIdValueObject`, `requestingUserId` as raw string; optional VOs constructed in the command constructor only when present (`name ? new PlantNameValueObject(name) : undefined`, etc.).

**Handler logic** (mirrors `UpdateUserCommandHandler` + owner check from proposal):
1. `const plant = await this.assertPlantExistsService.execute(command.plantId)` — loads tenant-scoped aggregate (throws `PlantNotFoundException` if absent in active space).
2. **Owner check:** `if (plant.userId !== command.requestingUserId) throw new NotPlantOwnerException(command.requestingUserId, command.plantId.value)`.
3. `plant.update({ name: command.name, species: command.species, imageUrl: command.imageUrl })` (emits single `PlantUpdatedEvent`).
4. `await this.plantWriteRepository.save(plant)`.
5. `await this.publishEvents(plant)`.

Returns `void`. Dependencies: `@Inject(PLANT_WRITE_REPOSITORY)`, `AssertPlantExistsService`, `EventBus`.

> **Owner check placement is the single extension point** for the future `admin-authorization` change: `if (plant.userId !== requestingUserId)` becomes `if (plant.userId !== requestingUserId && !isSpaceAdmin)`. One line, here, never in transport.

### 4.3 `DeletePlantCommand` + `DeletePlantCommandHandler`

**Inputs:** `{ plantId: string; requestingUserId: string }`.

**Handler logic:**
1. `const plant = await this.assertPlantExistsService.execute(command.plantId)` (tenant-scoped load; 404 if missing).
2. **Owner check:** same as Update → `NotPlantOwnerException` (403) on mismatch.
3. `plant.delete()` (emits `PlantDeletedEvent`).
4. `await this.plantWriteRepository.delete(plant.id.value)` — tenant repo scopes the delete by `spaceId`.
5. `await this.publishEvents(plant)`.

> Uses `AssertPlantExistsService` (which throws) rather than the silent `findById` + early-return of `DeleteUserCommandHandler`, because the proposal requires the owner check — we MUST load the aggregate to read `userId`, and a missing plant should 404, not no-op.

### 4.4 `PlantFindByIdQuery` + Handler

**Query:** `{ plantId: string }` → held as `PlantIdValueObject`. Mirrors `SpaceFindByIdQuery`.
**Handler** (`implements IQueryHandler<PlantFindByIdQuery, PlantViewModel>`): delegates to `this.assertPlantViewModelExistsService.execute(query.plantId)` — returns `PlantViewModel`, throws `PlantNotFoundException` (404). Tenant-scoped via the read repo. Exact copy of `SpaceFindByIdQueryHandler`.

### 4.5 `PlantFindByCriteriaQuery` + Handler

**Query:** `{ criteria: Criteria }`. Mirrors `UserFindByCriteriaQuery`.
**Handler** (`implements IQueryHandler<PlantFindByCriteriaQuery>`): `@Inject(PLANT_READ_REPOSITORY)`; returns `await this.plantReadRepository.findByCriteria(query.criteria)` → `PaginatedResult<PlantViewModel>`. Tenant scoping is automatic (read repo wraps `createTenantRepository`). Cross-space plants are invisible.

### 4.6 Assert Services

- **`AssertPlantViewModelExistsService`** (read side, `services/read/...`): `@Inject(PLANT_READ_REPOSITORY)`. `execute(id: PlantIdValueObject): Promise<PlantViewModel>` → `findById`, throw `PlantNotFoundException` if null. Copy of `AssertSpaceViewModelExistsService`. Used by `PlantFindByIdQueryHandler`.
- **`AssertPlantExistsService`** (write side, `services/write/...`): `@Inject(PLANT_WRITE_REPOSITORY)`. `execute(id: PlantIdValueObject): Promise<PlantAggregate>` → `findById`, throw `PlantNotFoundException` if null. Copy of `AssertSpaceExistsService`. Used by Update/Delete handlers (they need the aggregate to run the owner check + emit events).

---

## 5. Infrastructure Layer Design

### 5.1 `PlantTypeOrmEntity` (`@Entity('plants')`)

Mirrors `UserTypeOrmEntity` (which has nullable columns + `space_id`). No TypeORM relations — bare UUID columns (codebase convention).

| Property | Decorator | Type |
|----------|-----------|------|
| `id` | `@PrimaryGeneratedColumn('uuid')` | `string` |
| `name` | `@Column({ type: 'varchar', length: 100, nullable: false })` | `string` |
| `species` | `@Column({ type: 'varchar', length: 200, nullable: true })` | `string \| null` |
| `imageUrl` | `@Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })` | `string \| null` |
| `userId` | `@Column({ name: 'user_id', type: 'uuid', nullable: false })` | `string` |
| `spaceId` | `@Column({ name: 'space_id', type: 'uuid', nullable: false })` | `string` |
| `createdAt` | `@CreateDateColumn({ name: 'created_at', type: 'timestamp' })` | `Date` |
| `updatedAt` | `@UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })` | `Date` |

> **`spaceId` MUST be a concrete column with `{ spaceId: string }` shape** so `createTenantRepository<E extends { spaceId: string }>` type-checks and its proxy can stamp/filter on it. This is the structural requirement the tenant factory imposes.

### 5.2 `PlantTypeOrmMapper` (`@Injectable`)

Constructor injects `PlantBuilder`. Mirrors `UserTypeOrmMapper` (3 methods):
- `toAggregate(entity): PlantAggregate` — `plantBuilder.withId(entity.id).withName(entity.name).withSpecies(entity.species ?? null).withImageUrl(entity.imageUrl ?? null).withUserId(entity.userId).withSpaceId(entity.spaceId).withCreatedAt(entity.createdAt).withUpdatedAt(entity.updatedAt).build()`.
- `toEntity(plant): PlantTypeOrmEntity` — from `plant.toPrimitives()`, assign all columns onto `new PlantTypeOrmEntity()`.
- `toViewModel(entity): PlantViewModel` — same builder chain but `.buildViewModel()`.

### 5.3 Read & Write Repositories — tenant DI

Both mirror `UserTypeOrmReadRepository`/`UserTypeOrmWriteRepository` exactly.

**Pattern (identical for both):**
```ts
constructor(
  @InjectRepository(PlantTypeOrmEntity) rawRepo: Repository<PlantTypeOrmEntity>,
  private readonly mapper: PlantTypeOrmMapper,
  private readonly spaceContext: SpaceContext,
) {
  super();                                              // read repo extends BaseDatabaseRepository
  this.repo = createTenantRepository(rawRepo, spaceContext);
}
```

**How the DI works:**
1. NestJS injects the raw `Repository<PlantTypeOrmEntity>` (from `TypeOrmModule.forFeature([PlantTypeOrmEntity])` in `PlantsModule`) and the global `SpaceContext` (from `@Global() SharedModule`).
2. The constructor immediately wraps the raw repo: `createTenantRepository(rawRepo, spaceContext)` returns a `Proxy` that intercepts `findOne`/`find`/`findAndCount` (injects `where.spaceId = ctx.require()`), `save` (stamps `spaceId`), and `delete` (scopes by `spaceId`).
3. Every method on the repo then transparently operates only within the active space. `SpaceContext.require()` reads `spaceId` from the ALS frame set by `SpaceInterceptor`; if no frame is active it throws `SpaceContextMissingException`.

**`PlantTypeOrmReadRepository`** (`extends BaseDatabaseRepository implements IPlantReadRepository`):
- `findById(id)` → `this.repo.findOne({ where: { id } })` → `mapper.toViewModel(entity)` or `null`.
- `findByCriteria(criteria)` → `calculatePagination(criteria)` then `this.repo.findAndCount({ skip, take, order })` → map to view models → `new PaginatedResult(...)`. Copy of `UserTypeOrmReadRepository.findByCriteria`.
- `save(_vm)` / `delete(_id)` → **no-op stubs** (read-side projection; write side persists). Same as users/spaces read repos.

**`PlantTypeOrmWriteRepository`** (`implements IPlantWriteRepository`):
- `findById(id)` → `this.repository.findOne({ where: { id } })` → `mapper.toAggregate` or `null`.
- `save(plant)` → `mapper.toEntity(plant)` → `this.repository.save(entity)` (tenant proxy stamps `spaceId`) → `mapper.toAggregate(entity)`.
- `delete(id)` → `this.repository.delete(id)` (tenant proxy scopes by `spaceId`).
- `findByCriteria` → `throw new Error('Method not implemented.')` (mirrors `UserTypeOrmWriteRepository` — write side never queries by criteria).

---

## 6. Transport Layer Design

### 6.1 REST — `PlantsController` (`@Controller('plants')`)

`@ApiTags('plants')`, `@ApiBearerAuth()`. Constructor injects `CommandBus`, `QueryBus`, `PlantRestMapper`. **Dispatch ONLY via the buses — never inject application services.**

> **Guard model:** all endpoints are space-scoped (NO `@SkipSpace()`). The global `OptionalJwtAuthGuard` + `SpaceGuard` + `SpaceInterceptor` (registered in `AppModule` as `APP_GUARD`/`APP_INTERCEPTOR`) already enforce JWT + `X-Space-ID` membership + set the ALS frame globally. Each mutation additionally declares `@UseGuards(JwtAuthGuard)` to require authentication (matching `spaces`/`users` controller convention). No endpoint skips space scoping.

| Endpoint | Decorators | Signature → dispatch | Response | Status |
|----------|-----------|----------------------|----------|--------|
| **POST `/plants`** | `@Post()` `@UseGuards(JwtAuthGuard)` `@HttpCode(CREATED)` `@ApiOperation/@ApiResponse` | `create(@Body() dto: CreatePlantDto, @CurrentUser() user)` → `CommandBus.execute(new CreatePlantCommand({ name, species, imageUrl, userId: user.userId }))` returns `plantId`; then `QueryBus.execute(new PlantFindByIdQuery({ plantId }))` → VM → `mapper.toResponse(vm)` | `PlantRestResponseDto` | 201 (400/401/403) |
| **GET `/plants`** | `@Get()` `@UseGuards(JwtAuthGuard)` `@HttpCode(OK)` | `list(@Query() query: ...criteria)` → build `Criteria` → `QueryBus.execute(new PlantFindByCriteriaQuery({ criteria }))` → map items | `PaginatedResult<PlantRestResponseDto>` | 200 (400/401) |
| **GET `/plants/:id`** | `@Get(':id')` `@UseGuards(JwtAuthGuard)` `@HttpCode(OK)` | `get(@Param('id') id)` → `QueryBus.execute(new PlantFindByIdQuery({ plantId: id }))` → VM → `mapper.toResponse` | `PlantRestResponseDto` | 200 (401/404) |
| **PATCH `/plants/:id`** | `@Patch(':id')` `@UseGuards(JwtAuthGuard)` `@HttpCode(OK)` | `update(@Param('id') id, @Body() dto: UpdatePlantDto, @CurrentUser() user)` → `CommandBus.execute(new UpdatePlantCommand({ plantId: id, ...dto, requestingUserId: user.userId }))`; then re-query by id → mapper | `PlantRestResponseDto` | 200 (400/401/403/404) |
| **DELETE `/plants/:id`** | `@Delete(':id')` `@UseGuards(JwtAuthGuard)` `@HttpCode(NO_CONTENT)` | `delete(@Param('id') id, @CurrentUser() user)` → `CommandBus.execute(new DeletePlantCommand({ plantId: id, requestingUserId: user.userId }))` | `void` | 204 (401/403/404) |

**REST DTOs:**
- `CreatePlantDto`: `name` (`@IsString @IsNotEmpty @ApiProperty`), `species?` (`@IsOptional @IsString @ApiProperty`), `imageUrl?` (`@IsOptional @IsString @ApiProperty`). Mirrors `CreateSpaceDto`.
- `UpdatePlantDto`: all three optional (`@IsOptional @IsString`).
- `PlantRestResponseDto`: `id`, `name`, `species`, `imageUrl`, `userId`, `spaceId`, `createdAt`, `updatedAt` — all `@ApiProperty`. Mirrors `SpaceRestResponseDto`.

**`PlantRestMapper`** (`@Injectable`): `toResponse(vm: PlantViewModel): PlantRestResponseDto` — `new PlantRestResponseDto()`, copy every field 1:1. Copy of `SpaceRestMapper`.

### 6.2 GraphQL — Resolvers

Mirror `users` resolvers. `@Resolver()` (no model binding). Same global guard stack applies (JWT + SpaceGuard via `AppModule` `APP_GUARD`s).

**`PlantQueriesResolver`** (constructor: `QueryBus`, `PlantGraphQLMapper`):
- `@Query(() => PaginatedPlantResultDto) plantsFindByCriteria(@Args('input', { nullable: true }) input?: PlantFindByCriteriaRequestDto)` → build `new Criteria(input?.filters, input?.sorts, input?.pagination)` → `QueryBus.execute(new PlantFindByCriteriaQuery({ criteria }))` → `mapper.toPaginatedResponseDto(result)`.
- `@Query(() => PlantResponseDto, { nullable: true }) plantFindById(@Args('input') input: PlantFindByIdRequestDto)` → `QueryBus.execute(new PlantFindByIdQuery({ plantId: input.id }))` → `mapper.toResponseDtoFromViewModel(result)`.

**`PlantMutationsResolver`** (constructor: `CommandBus`, `MutationResponseGraphQLMapper` from kit):
- `@Mutation(() => MutationResponseDto) plantCreate(@Args('input') input: CreatePlantRequestDto)` → here we need the owner id; GraphQL has no `@CurrentUser` REST decorator, so use the GQL context user (proposal: JWT on both transports). Dispatch `new CreatePlantCommand({ name, species, imageUrl, userId: <ctx user id> })`; return `mutationResponseGraphQLMapper.toResponseDto({ success: true, message: 'Plant created successfully', id: plantId })`.
- `@Mutation(() => MutationResponseDto) plantUpdate(@Args('input') input: UpdatePlantRequestDto)` → `new UpdatePlantCommand({ plantId: input.id, name, species, imageUrl, requestingUserId: <ctx user id> })` → response DTO.
- `@Mutation(() => MutationResponseDto) plantDelete(@Args('input') input: DeletePlantRequestDto)` → `new DeletePlantCommand({ plantId: input.id, requestingUserId: <ctx user id> })` → response DTO.

> **Current-user resolution on GraphQL:** the `users` resolvers currently comment out `@UseGuards(JwtAuthGuard)`, but plants require the authenticated user id for owner checks. Design decision: obtain the user id from the GraphQL execution context (the global `OptionalJwtAuthGuard` decodes the JWT into `req.user`; `GraphQLModule` context exposes `req`). Use a `@Context()`/`@CurrentUser()`-style accessor consistent with how the project reads `req.user` in resolvers. This is a known integration point flagged in §11 Risks — the tasks phase must confirm the exact GQL current-user accessor.

**GraphQL request DTOs (`@InputType`):**
- `CreatePlantRequestDto`: `name` (`@Field String`, `@IsNotEmpty`), `species?` (`@Field String nullable`, `@IsOptional`), `imageUrl?` (`@Field String nullable`, `@IsOptional`).
- `UpdatePlantRequestDto`: `id` (`@Field String`, `@IsUUID`), `name?`, `species?`, `imageUrl?` (all nullable/optional).
- `DeletePlantRequestDto`: `id` (`@IsUUID @IsNotEmpty`). Mirrors `UserDeleteRequestDto`.
- `PlantFindByIdRequestDto`: `id` (`@IsUUID @IsNotEmpty`). Mirrors `UserFindByIdRequestDto`.
- `PlantFindByCriteriaRequestDto`: `filters?`, `sorts?`, `pagination?` — mirrors `UserFindByCriteriaRequestDto`.

**GraphQL response DTOs (`@ObjectType`):** `plant.response.dto.ts`:
- `PlantResponseDto` (`@ObjectType('PlantResponseDto')`): `id` (`@Field(() => ID)`), `name`, `species?` (nullable), `imageUrl?` (nullable), `userId`, `spaceId`, `createdAt` (`@Field(() => Date)`), `updatedAt` (`@Field(() => Date, { nullable: true })`). Mirrors `UserResponseDto`.
- `PaginatedPlantResultDto` (`@ObjectType('PaginatedPlantResultDto') extends BasePaginatedResultDto`): `items!: PlantResponseDto[]`. Mirrors `PaginatedUserResultDto`.

**`PlantGraphQLMapper`** (`@Injectable`): `toResponseDtoFromViewModel(vm): PlantResponseDto` (1:1 field copy) + `toPaginatedResponseDto(result): PaginatedPlantResultDto` (map items + `total/page/perPage/totalPages`). Copy of `UserGraphQLMapper`.

### 6.3 Both mappers convert the SAME ViewModel

- `PlantRestMapper.toResponse(vm)` and `PlantGraphQLMapper.toResponseDtoFromViewModel(vm)` both take a `PlantViewModel` and copy identical fields. The only difference is the target DTO class (`@ApiProperty` vs `@Field`). **No business logic in either mapper** — pure field projection.

### 6.4 `plant-registered-enums.graphql.ts`

**No enums needed initially** (plant has no enum-typed fields — name/species/imageUrl are all strings; status/role do not exist on plants). The file is created as an **empty scaffold** mirroring `user-registered-enums.graphql.ts` structure (an empty `registeredPlantEnums` array + the `for...of registerEnumType` loop), and `import './transport/graphql/enums/plant/plant-registered-enums.graphql'` is added to `PlantsModule` (side-effect import) so the wiring exists for future enums (e.g. a `PlantStatusEnum`). If no enum is ever added, this file may be omitted — but scaffolding it now matches the `users` convention and avoids a future module edit.

---

## 7. Module Registration — `PlantsModule`

```ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreatePlantCommandHandler } from './application/commands/create-plant/create-plant.handler';
import { UpdatePlantCommandHandler } from './application/commands/update-plant/update-plant.handler';
import { DeletePlantCommandHandler } from './application/commands/delete-plant/delete-plant.handler';
import { PlantFindByIdQueryHandler } from './application/queries/plant-find-by-id/plant-find-by-id.handler';
import { PlantFindByCriteriaQueryHandler } from './application/queries/plant-find-by-criteria/plant-find-by-criteria.handler';
import { AssertPlantViewModelExistsService } from './application/services/read/assert-plant-view-model-exists/assert-plant-view-model-exists.service';
import { AssertPlantExistsService } from './application/services/write/assert-plant-exists/assert-plant-exists.service';
import { PlantBuilder } from './domain/builders/plant.builder';
import { PLANT_READ_REPOSITORY } from './domain/repositories/read/plant-read.repository';
import { PLANT_WRITE_REPOSITORY } from './domain/repositories/write/plant-write.repository';
import { PlantTypeOrmEntity } from './infrastructure/persistence/typeorm/entities/plant.entity';
import { PlantTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/plant-typeorm.mapper';
import { PlantTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/plant-typeorm-read.repository';
import { PlantTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/plant-typeorm-write.repository';
import { PlantsController } from './transport/rest/controllers/plants.controller';
import { PlantRestMapper } from './transport/rest/mappers/plant/plant.mapper';
import './transport/graphql/enums/plant/plant-registered-enums.graphql';
import { PlantGraphQLMapper } from './transport/graphql/mappers/plant/plant.mapper';
import { PlantQueriesResolver } from './transport/graphql/resolvers/plant/plant-queries.resolver';
import { PlantMutationsResolver } from './transport/graphql/resolvers/plant/plant-mutations.resolver';

const COMMAND_HANDLERS = [
  CreatePlantCommandHandler,
  UpdatePlantCommandHandler,
  DeletePlantCommandHandler,
];

const QUERY_HANDLERS = [
  PlantFindByIdQueryHandler,
  PlantFindByCriteriaQueryHandler,
];

const APPLICATION_SERVICES = [
  AssertPlantViewModelExistsService,
  AssertPlantExistsService,
];

const DOMAIN_BUILDERS = [PlantBuilder];

const INFRASTRUCTURE_REPOSITORIES = [
  { provide: PLANT_READ_REPOSITORY, useClass: PlantTypeOrmReadRepository },
  { provide: PLANT_WRITE_REPOSITORY, useClass: PlantTypeOrmWriteRepository },
];

const INFRASTRUCTURE_MAPPERS = [PlantTypeOrmMapper];

const INFRASTRUCTURE_ENTITIES = [PlantTypeOrmEntity];

const REST_CONTROLLERS = [PlantsController];

const REST_PROVIDERS = [PlantRestMapper];

const GRAPHQL_PROVIDERS = [
  PlantQueriesResolver,
  PlantMutationsResolver,
  PlantGraphQLMapper,
];

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES)],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...APPLICATION_SERVICES,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...REST_PROVIDERS,
    ...GRAPHQL_PROVIDERS,
  ],
  exports: [],
})
export class PlantsModule {}
```

> **`SpaceContext` is NOT declared here** — it is provided globally by `SharedModule` (`@Global()`). This intentionally diverges from `SpacesModule` (which redundantly re-provides it). `AppModule` adds `PlantsModule` to `imports[]`.

---

## 8. Dual Transport — Behavioral Contract

> **REST and GraphQL MUST return identical plant data. This is a hard contract.**

- Both transports dispatch to the **same** `CommandBus`/`QueryBus` handlers. There is exactly one implementation of create/update/delete/find logic.
- Both query paths resolve to the **same** `PlantViewModel` produced by the read repository.
- The ONLY divergence is encoding: `PlantRestMapper` → `PlantRestResponseDto` (JSON via `@ApiProperty`); `PlantGraphQLMapper` → `PlantResponseDto` (GraphQL via `@Field`). Both copy the identical set of fields `{ id, name, species, imageUrl, userId, spaceId, createdAt, updatedAt }` with no transformation.
- Authorization, tenant scoping, owner checks, and validation rules are identical because they live in the shared application/domain layers, not in transport.
- **Drift prevention:** any field added to `PlantViewModel` must be added to BOTH response DTOs and BOTH mappers. Tests must exercise both surfaces (REST e2e + GraphQL e2e) for the same scenario.

---

## 9. Migration SQL — `1780000000005-CreatePlants.ts`

Hand-written TypeScript migration (codebase convention), mirroring `CreateSpaces1780000000001`. Timestamp `1780000000005` is the next after the highest existing (`...004-AddSpaceIdToUsers`), so it sorts last.

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlants1780000000005 implements MigrationInterface {
  name = 'CreatePlants1780000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "plants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "species" character varying(200),
        "image_url" character varying(500),
        "user_id" uuid NOT NULL,
        "space_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plants_id" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "plants"`);
  }
}
```

> No FK constraints (bare UUID convention — same as `spaces`/`users`). `name` is NOT unique (proposal). `species`/`image_url` nullable. `space_id`/`user_id` NOT NULL.

---

## 10. Dependency Injection Map

| Symbol token | Bound class | Wired in |
|--------------|-------------|----------|
| `PLANT_READ_REPOSITORY` | `PlantTypeOrmReadRepository` | `PlantsModule` providers (`{ provide, useClass }`) |
| `PLANT_WRITE_REPOSITORY` | `PlantTypeOrmWriteRepository` | `PlantsModule` providers (`{ provide, useClass }`) |

**Injected by:**
- `PLANT_WRITE_REPOSITORY` → `CreatePlantCommandHandler`, `AssertPlantExistsService` (used by Update/Delete handlers).
- `PLANT_READ_REPOSITORY` → `PlantFindByCriteriaQueryHandler`, `AssertPlantViewModelExistsService` (used by `PlantFindByIdQueryHandler`).
- `SpaceContext` (global) → both repos (for `createTenantRepository`) + `CreatePlantCommandHandler` (for `withSpaceId(require())`).

---

## 11. Architectural Risks & Assumptions Requiring Validation

1. **Exception filter wiring (HIGH).** `PlantNotFoundException`/`NotPlantOwnerException` MUST be added to `BaseExceptionFilter.resolveStatus()` or they return 400 instead of 404/403 — on BOTH transports. This is an explicit MODIFIED file, easy to forget. Tasks phase must include it as a discrete step with an e2e assertion on status codes.
2. **GraphQL current-user accessor (MED — needs validation).** REST uses the `@CurrentUser()` decorator from `auth`. GraphQL resolvers in `users` currently comment out the JWT guard and have no current-user pattern. Plants mutations REQUIRE the authenticated user id for owner checks. The exact GQL accessor (likely reading `req.user` from the GraphQL context populated by `OptionalJwtAuthGuard`) must be confirmed in the tasks/apply phase. Assumption: a GQL-compatible current-user mechanism exists or a thin `@Context()` read of `req.user.userId` is acceptable.
3. **Optional VO semantics (MED).** Designing `species`/`imageUrl` as `VO | null` (not raw strings) diverges slightly from `users`' raw-string approach. The builder/command must consistently translate `undefined`/`null`/empty → `null` and present-string → VO. Inconsistent handling could let an empty string slip past `allowEmpty: false`. Mitigation: VO is only constructed when value is a non-empty string.
4. **Tenant scoping completeness (MED/HIGH per proposal).** Both repos MUST wrap `createTenantRepository`. The write `delete()` relies on the proxy scoping by `spaceId` — verify the proxy's string-criteria branch (`{ id, spaceId }`) actually filters cross-space deletes. E2e: space A cannot read/delete space B's plant.
5. **`SpaceContext.require()` in `CreatePlantCommandHandler` (LOW/MED).** Injecting `SpaceContext` into the handler to set `withSpaceId` couples the handler to the tenancy primitive. Alternative: pass a placeholder and let the tenant repo stamp it (the persisted row is correct either way), but then the in-memory aggregate's `spaceId`/emitted event would carry the placeholder. Decision: inject `SpaceContext` so the aggregate + event snapshot are accurate. Validate this is acceptable for event consumers.
6. **`registered-enums` scaffold (LOW).** No enums exist yet; the empty scaffold is optional. If the tasks phase prefers zero dead files, it may skip `plant-registered-enums.graphql.ts` and its module import until a real enum is introduced.
```
