# Tasks: Planting Spot Fallow Status

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 320–380 |
| 400-line budget risk | Low-Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-shot |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All files (domain + persistence + transport + wiring + tests) | PR 1 | Additive, single existing context, two small new commands, no cross-context coupling |

---

## Phase 1: Domain

- [x] T1 — Create `src/contexts/planting-spots/domain/enums/planting-spot-status.enum.ts` — `PlantingSpotStatusEnum` with `ACTIVE = 'active'`, `FALLOW = 'fallow'`.
- [x] T2 — Create `src/contexts/planting-spots/domain/value-objects/planting-spot-status/planting-spot-status.value-object.ts` — `PlantingSpotStatusValueObject extends EnumValueObject<typeof PlantingSpotStatusEnum>` (mirrors `PlantingSpotTypeValueObject`). Co-located `.spec.ts`.
- [x] T3 — Create `src/contexts/planting-spots/domain/value-objects/planting-spot-fallow-since/planting-spot-fallow-since.value-object.ts` — `PlantingSpotFallowSinceValueObject extends DateValueObject` (mirrors `CareScheduleLastCompletedAtValueObject`). Co-located `.spec.ts`.
- [x] T4 — Modify `src/contexts/planting-spots/domain/primitives/planting-spot.primitives.ts` — add `status: string; fallowSince: Date | null;` to `IPlantingSpotPrimitives`.
- [x] T5 — Modify `src/contexts/planting-spots/domain/interfaces/planting-spot.interface.ts` — add `status: PlantingSpotStatusValueObject; fallowSince: PlantingSpotFallowSinceValueObject | null;` to `IPlantingSpot`.
- [x] T6 — Create `src/contexts/planting-spots/domain/events/field-changed/status-changed/status-changed.event.ts` — `PlantingSpotStatusChangedEvent` (same shape as `type-changed.event.ts`).
- [x] T7 — Create `src/contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception.ts` if not already present — reuse existing (already exists per current codebase; no action if so).
- [x] T8 — Modify `src/contexts/planting-spots/domain/aggregates/planting-spot.aggregate.ts`:
  - Add private fields `_status: PlantingSpotStatusValueObject`, `_fallowSince: PlantingSpotFallowSinceValueObject | null`; hydrate both in constructor from `props`.
  - Add public `markFallow(): void` — calls `this.changeStatus(new PlantingSpotStatusValueObject(PlantingSpotStatusEnum.FALLOW))`.
  - Add public `markActive(): void` — calls `this.changeStatus(new PlantingSpotStatusValueObject(PlantingSpotStatusEnum.ACTIVE))`.
  - Add private `changeStatus(newStatus: PlantingSpotStatusValueObject)`: no-op if `newStatus.value === this._status.value`; otherwise reassign `_status`, derive `_fallowSince` (`new PlantingSpotFallowSinceValueObject(new Date())` when new value is `FALLOW`, else `null`), call `touch()`, apply `PlantingSpotStatusChangedEvent` with `{ id, oldValue, newValue }`.
  - Do NOT add `status` to `update()`'s param type — `update()` stays exactly as-is.
  - Add `status`/`fallowSince` to `toPrimitives()`.
  - Add `get status()` / `get fallowSince()` getters.
  - Co-located `.spec.ts`: cover `markFallow()` ACTIVE→FALLOW (sets fallowSince, emits event), `markActive()` FALLOW→ACTIVE (clears fallowSince, emits event), no-op calls in both directions (no event, no touch), and confirm `update()` never touches status.
- [x] T9 — Modify `src/contexts/planting-spots/domain/builders/planting-spot.builder.ts` — add `private _status: string = PlantingSpotStatusEnum.ACTIVE;` and `private _fallowSince: Date | null = null;`; add `withStatus(status: string): this` and `withFallowSince(fallowSince: Date | null): this`; wire both into the aggregate/view-model construction in `build()`/`buildViewModel()` (wrap `_status` in `PlantingSpotStatusValueObject`, `_fallowSince` in `PlantingSpotFallowSinceValueObject | null`).
- [x] T10 — Modify `src/contexts/planting-spots/domain/view-models/planting-spot.view-model.ts` — add `status: string; fallowSince: Date | null;` public readonly fields, assigned from `props.status` / `props.fallowSince`.

## Phase 2: Application

- [x] T11 — Modify `src/contexts/planting-spots/application/commands/create-planting-spot/create-planting-spot.command.ts` — change `CreatePlantingSpotCommandInput` to `Omit<IPlantingSpotPrimitives, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'fallowSince'>`; in the constructor hardcode `this.status = new PlantingSpotStatusValueObject(PlantingSpotStatusEnum.ACTIVE); this.fallowSince = null;`.
- [x] T12 — Modify `src/contexts/planting-spots/application/commands/create-planting-spot/create-planting-spot.handler.ts` — add `.withStatus(command.status.value)` and `.withFallowSince(command.fallowSince)` to the builder chain.
- [x] T13 — Create `src/contexts/planting-spots/application/commands/mark-planting-spot-fallow/mark-planting-spot-fallow.command.ts` — `MarkPlantingSpotFallowCommandInput = Pick<IPlantingSpotPrimitives, 'spaceId' | 'id'> & { requestingUserId: string }`; `MarkPlantingSpotFallowCommand` class with `id`/`requestingUserId`/`spaceId` value objects (identical shape to `DeletePlantingSpotCommand`).
- [x] T14 — Create `src/contexts/planting-spots/application/commands/mark-planting-spot-fallow/mark-planting-spot-fallow.handler.ts` — `MarkPlantingSpotFallowCommandHandler`: load spot via `AssertPlantingSpotExistsService`, enforce ownership (`PlantingSpotForbiddenException` if `spot.userId.value !== command.requestingUserId.value`), call `spot.markFallow()`, `save`, `publishEvents`, log. Co-located `.spec.ts`.
- [x] T15 — Create `src/contexts/planting-spots/application/commands/mark-planting-spot-active/mark-planting-spot-active.command.ts` — mirror of T13 for `MarkPlantingSpotActiveCommand`.
- [x] T16 — Create `src/contexts/planting-spots/application/commands/mark-planting-spot-active/mark-planting-spot-active.handler.ts` — mirror of T14 calling `spot.markActive()`. Co-located `.spec.ts`.
- [x] T17 — Update `create-planting-spot` command/handler `.spec.ts` to cover the new hardcoded `status`/`fallowSince`.

## Phase 3: Persistence

- [x] T18 — Modify `src/contexts/planting-spots/infrastructure/persistence/typeorm/entities/planting-spot.entity.ts` — add `@Column({ type: 'varchar', length: 10, nullable: false, default: 'active' }) status!: string;` and `@Column({ name: 'fallow_since', type: 'timestamptz', nullable: true }) fallowSince!: Date | null;`.
- [x] T19 — Modify `src/contexts/planting-spots/infrastructure/persistence/typeorm/mappers/planting-spot-typeorm.mapper.ts` — add `.withStatus(entity.status).withFallowSince(entity.fallowSince)` to `toDomain` and `toViewModel`; add `entity.status = primitives.status; entity.fallowSince = primitives.fallowSince;` to `toPersistence`.
- [x] T20 — Create `src/database/migrations/1780000000022-AddStatusAndFallowSinceToPlantingSpots.ts`:
  - `up`: `ALTER TABLE "planting_spots" ADD COLUMN "status" character varying(10) NOT NULL DEFAULT 'active', ADD COLUMN "fallow_since" timestamptz NULL`.
  - `down`: `ALTER TABLE "planting_spots" DROP COLUMN IF EXISTS "status", DROP COLUMN IF EXISTS "fallow_since"`.
- [x] T21 — Update mapper `.spec.ts` to cover status/fallowSince round-tripping.

## Phase 4: GraphQL transport

- [x] T22 — Modify `src/contexts/planting-spots/transport/graphql/enums/planting-spot-registered-enums.graphql.ts` — `registerEnumType(PlantingSpotStatusEnum, { name: 'PlantingSpotStatusEnum' })`.
- [x] T23 — Create `src/contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-mark-fallow.request.dto.ts` — `PlantingSpotMarkFallowRequestDto` with just `id` (`@IsUUID`, `@IsNotEmpty`) — same shape as `PlantingSpotDeleteRequestDto`.
- [x] T24 — Create `src/contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-mark-active.request.dto.ts` — `PlantingSpotMarkActiveRequestDto`, mirror of T23.
- [x] T25 — Modify `src/contexts/planting-spots/transport/graphql/dtos/responses/planting-spot.response.dto.ts` — add `@Field(() => PlantingSpotStatusEnum) status!: PlantingSpotStatusEnum;` and `@Field(() => Date, { nullable: true }) fallowSince?: Date | null;` to `PlantingSpotResponseDto`.
- [x] T26 — Modify `src/contexts/planting-spots/transport/graphql/mappers/planting-spot/planting-spot.mapper.ts` — include `status` (cast to `PlantingSpotStatusEnum`) and `fallowSince` in `toResponseDtoFromViewModel`.
- [x] T27 — Modify `src/contexts/planting-spots/transport/graphql/resolvers/planting-spot/mutations/planting-spot-mutations.resolver.ts` — add `plantingSpotMarkFallow(@Args('input') input: PlantingSpotMarkFallowRequestDto, @CurrentUser() user)` and `plantingSpotMarkActive(...)` mutations, each dispatching the corresponding command with `id`, `requestingUserId: user.userId`, `spaceId: this.spaceContext.require()`, and returning `MutationResponseDto` via `mutationResponseGraphQLMapper.toResponseDto(...)` (same pattern as `plantingSpotDelete`).
- [x] T28 — Update relevant resolver/mapper `.spec.ts` files.

## Phase 5: REST transport

- [x] T29 — Modify `src/contexts/planting-spots/transport/rest/dtos/planting-spot-rest-response.dto.ts` — add `status: PlantingSpotStatusEnum;` and `fallowSince: Date | null;` to `PlantingSpotRestResponseDto`.
- [x] T30 — Modify `src/contexts/planting-spots/transport/rest/mappers/planting-spot/planting-spot.mapper.ts` — set `dto.status = vm.status as PlantingSpotStatusEnum; dto.fallowSince = vm.fallowSince;` in `toResponse`.
- [x] T31 — Modify `src/contexts/planting-spots/transport/rest/controllers/planting-spots.controller.ts`:
  - Add `POST :id/mark-fallow` (`@Post(':id/mark-fallow')`, `@HttpCode(200)`) dispatching `MarkPlantingSpotFallowCommand`, then re-querying via `PlantingSpotFindByIdQuery` and returning `PlantingSpotRestResponseDto` (same pattern as `PATCH :id`). Document `403 Not the owner` / `404 Not found` responses.
  - Add `POST :id/mark-active` mirror endpoint dispatching `MarkPlantingSpotActiveCommand`.
- [x] T32 — Update controller/mapper `.spec.ts` files with the two new endpoints (happy path, 403, 404).

## Phase 6: MCP transport

- [x] T33 — Create `src/contexts/planting-spots/transport/mcp/schemas/planting-spot-mark-fallow.schema.ts` — `plantingSpotMarkFallowSchema = { id: z.string().uuid().describe('Id of the planting spot to mark fallow') }`.
- [x] T34 — Create `src/contexts/planting-spots/transport/mcp/schemas/planting-spot-mark-active.schema.ts` — mirror of T33.
- [x] T35 — Create `src/contexts/planting-spots/transport/mcp/tools/planting-spot-mark-fallow.tool.ts` — `PlantingSpotMarkFallowMcpTool implements IMcpTool`, `name = 'planting_spot_mark_fallow'`, dispatches `MarkPlantingSpotFallowCommand` with `spaceId`/`userId` from `IMcpToolContext` (mirrors `PlantingSpotUpdateMcpTool` structure but with the smaller schema).
- [x] T36 — Create `src/contexts/planting-spots/transport/mcp/tools/planting-spot-mark-active.tool.ts` — mirror of T35 for `planting_spot_mark_active`.
- [x] T37 — Modify `src/contexts/planting-spots/planting-spots.module.ts` — register `MarkPlantingSpotFallowCommandHandler`/`MarkPlantingSpotActiveCommandHandler` in `COMMAND_HANDLERS`, and both new MCP tools in the `MCP_TOOLS` array.

## Phase 7: Docs & verification

- [x] T38 — Update `src/contexts/planting-spots/README.md` (per `openspec/config.yaml` apply rule: reflect current state, not just the delta) with the new `status`/`fallowSince` fields and the two new dedicated actions/endpoints/tools.
- [x] T39 — Ran `pnpm lint` (clean), `pnpm tsc --noEmit` (clean), `pnpm test` (388/388 suites, 1605/1605 tests passing). `pnpm test:integration` / `pnpm test:e2e` were **not run** — this sandbox has no Docker/Postgres available (`docker ps` fails: no daemon). Run these against a real Postgres before merging.
