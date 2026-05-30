# Tasks: Plant Bounded Context

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1400–1800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Domain+Application → PR 2: Infrastructure+Module → PR 3: Transport+Tests |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Migration + Domain + Application | PR 1 | Base: main; includes T1–T12 + T25 unit tests |
| 2 | Infrastructure + Module wiring | PR 2 | Base: PR 1 branch; includes T13–T16 + T24 + T26 integration tests |
| 3 | Transport (REST + GraphQL) + E2E tests | PR 3 | Base: PR 2 branch; includes T17–T23 + T27 |

---

## Dependency Graph

```
T1 (migration) — independent
T2 → T3 → T4, T5, T6
T6 → T7, T8, T9, T10, T11, T12
T12 → T8, T9
T3, T7–T12 → T25 (unit tests)
T13 → T14 → T15, T16
T15, T16 → T26 (integration tests)
T6, T13–T16 → T24 (module)
T17 → T18 → T19
T20 → T21 → T22, T23
T24 → T27 (E2E)
```

---

## Phase 1: Foundation — Migration + Domain

- [x] T1: Create `src/database/migrations/1780000000005-CreatePlants.ts` — `up()` creates `plants` table (id uuid PK, name varchar(100) NOT NULL, species varchar(200), image_url varchar(500), user_id uuid NOT NULL, space_id uuid NOT NULL, created_at/updated_at TIMESTAMP DEFAULT now()); `down()` drops table. No FK constraints.
- [x] T2: Create value objects in `src/contexts/plants/domain/value-objects/`: `plant-id/plant-id.value-object.ts` (extends UuidValueObject), `plant-name/plant-name.value-object.ts` (extends StringValueObject, maxLength:100, allowEmpty:false), `plant-species/plant-species.value-object.ts` (maxLength:200, allowEmpty:false), `plant-image-url/plant-image-url.value-object.ts` (maxLength:500, allowEmpty:false). Acceptance: empty name throws; valid string constructs.
- [x] T3: Create `src/contexts/plants/domain/aggregates/plant.aggregate.ts` (PlantAggregate extends BaseAggregate; fields _id, _name, _species|null, _imageUrl|null, _userId string, _spaceId string; methods create/update/delete; toPrimitives). Create `src/contexts/plants/domain/interfaces/plant.interface.ts` (IPlant VO-typed props), `src/contexts/plants/domain/primitives/plant.primitives.ts` (IPlantPrimitives), `src/contexts/plants/domain/view-models/plant.view-model.ts` (PlantViewModel extends BaseViewModel), `src/contexts/plants/domain/builders/plant.builder.ts` (PlantBuilder @Injectable extends BaseBuilder; withName/withSpecies/withImageUrl/withUserId/withSpaceId; build() + buildViewModel(); validate() requires name/userId/spaceId).
- [x] T4: Create domain events in `src/contexts/plants/domain/events/`: `interfaces/plant-event-data.interface.ts` (IPlantEventData = full snapshot), `plant-created/plant-created.event.ts`, `plant-updated/plant-updated.event.ts`, `plant-deleted/plant-deleted.event.ts` — all extend BaseEvent<IPlantEventData>. Acceptance: each event carries full plant snapshot from toPrimitives.
- [x] T5: Create `src/contexts/plants/domain/exceptions/plant-not-found.exception.ts` (PlantNotFoundException extends BaseException, message includes id) and `src/contexts/plants/domain/exceptions/not-plant-owner.exception.ts` (NotPlantOwnerException extends BaseException, message includes userId+plantId). **CRITICAL: modify `src/core/filters/base-exception.filter.ts`** — add imports for both exceptions; add PlantNotFoundException to the 404 (NOT_FOUND) instanceof branch; add NotPlantOwnerException to the 403 (FORBIDDEN) instanceof branch. Acceptance: E2E returns 404 for PlantNotFound, 403 for NotPlantOwner.
- [x] T6: Create `src/contexts/plants/domain/repositories/read/plant-read.repository.ts` (IPlantReadRepository = IBaseReadRepository<PlantViewModel>) and `src/contexts/plants/domain/repositories/write/plant-write.repository.ts` (IPlantWriteRepository = IBaseWriteRepository<PlantAggregate>). Create Symbol tokens file `src/contexts/plants/domain/repositories/plant-repository.tokens.ts` (PLANT_READ_REPOSITORY, PLANT_WRITE_REPOSITORY). Acceptance: tokens are unique Symbols; interfaces compile with the kit generics.

---

## Phase 2: Application Layer

> Write T25 unit tests alongside or immediately after each handler/service.

- [x] T7: Create `src/contexts/plants/application/commands/create-plant/create-plant.command.ts` (inputs: name, species?, imageUrl?, userId) and `src/contexts/plants/application/commands/create-plant/create-plant.handler.ts` (extends BaseCommandHandler; injects PLANT_WRITE_REPOSITORY, PlantBuilder, SpaceContext, EventBus; generates id, withSpaceId(spaceContext.require()), aggregate.create(), save, publishEvents, return id). Acceptance: handler returns plantId; PlantCreated published.
- [x] T8: Create `src/contexts/plants/application/commands/update-plant/update-plant.command.ts` (inputs: plantId, name?, species?, imageUrl?, requestingUserId) and `src/contexts/plants/application/commands/update-plant/update-plant.handler.ts` (assertPlantExistsService → owner check → aggregate.update() → save → publishEvents). Depends on T12. Acceptance: non-owner throws NotPlantOwnerException; missing plant throws PlantNotFoundException.
- [x] T9: Create `src/contexts/plants/application/commands/delete-plant/delete-plant.command.ts` (inputs: plantId, requestingUserId) and `src/contexts/plants/application/commands/delete-plant/delete-plant.handler.ts` (assertPlantExistsService → owner check → aggregate.delete() → writeRepo.delete(id) → publishEvents). Depends on T12. Acceptance: non-owner → 403; missing plant → 404; owner success removes record.
- [x] T10: Create `src/contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.query.ts` and `src/contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.handler.ts` (delegates to AssertPlantViewModelExistsService). Create `src/contexts/plants/application/services/read/assert-plant-view-model-exists/assert-plant-view-model-exists.service.ts` (injects PLANT_READ_REPOSITORY; returns PlantViewModel or throws PlantNotFoundException). Acceptance: existing plant returns VM; missing plant returns 404.
- [x] T11: Create `src/contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.query.ts` (inputs: criteria Criteria object) and `src/contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.handler.ts` (injects PLANT_READ_REPOSITORY; calls findByCriteria; returns PaginatedResult<PlantViewModel>). Acceptance: returns paginated list scoped to active space; tenant isolation holds.
- [x] T12: Create `src/contexts/plants/application/services/write/assert-plant-exists/assert-plant-exists.service.ts` (injects PLANT_WRITE_REPOSITORY; returns PlantAggregate or throws PlantNotFoundException — used by T8 and T9 for owner check). Acceptance: returns aggregate when found; throws PlantNotFoundException when absent.
- [x] T25: Write unit tests for domain + application: `plant.aggregate.spec.ts` (create/update/delete, empty-name rejection, event emission), value object specs (PlantName empty guard), `create-plant.handler.spec.ts`, `update-plant.handler.spec.ts` (owner check), `delete-plant.handler.spec.ts` (owner check), `plant-find-by-id.handler.spec.ts`, `plant-find-by-criteria.handler.spec.ts`, assert services specs. All in co-located `.spec.ts` files. Coverage ≥ 80% for this layer.

---

## Phase 3: Infrastructure

- [ ] T13: Create `src/contexts/plants/infrastructure/persistence/typeorm/entities/plant.entity.ts` — PlantTypeOrmEntity @Entity('plants'): id (PrimaryGeneratedColumn uuid), name varchar(100) NOT NULL, species varchar(200) nullable, imageUrl @Column({name:'image_url'}) varchar(500) nullable, userId @Column({name:'user_id'}) uuid NOT NULL, spaceId @Column({name:'space_id'}) uuid NOT NULL, createdAt/updatedAt timestamps. spaceId must be a concrete column (required by createTenantRepository generic constraint).
- [ ] T14: Create `src/contexts/plants/infrastructure/persistence/typeorm/mappers/plant-typeorm.mapper.ts` — PlantTypeOrmMapper @Injectable(PlantBuilder): `toAggregate(entity)`, `toEntity(aggregate)`, `toViewModel(entity)` (mirror UserTypeOrmMapper). Acceptance: round-trip toEntity→toAggregate is lossless; optional fields map null correctly.
- [ ] T15: Create `src/contexts/plants/infrastructure/persistence/typeorm/repositories/plant-typeorm-read.repository.ts` — PlantTypeOrmReadRepository: constructor wraps `createTenantRepository(rawRepo, spaceContext)`; implements IPlantReadRepository (findById, findByCriteria with calculatePagination+findAndCount). Acceptance: findByCriteria only returns plants matching active spaceId; cross-space plant invisible.
- [ ] T16: Create `src/contexts/plants/infrastructure/persistence/typeorm/repositories/plant-typeorm-write.repository.ts` — PlantTypeOrmWriteRepository: same tenant proxy pattern; implements IPlantWriteRepository (findById → toAggregate, save → toEntity→save→toAggregate, delete by id). Acceptance: save persists with correct spaceId stamped by proxy; delete is scoped.
- [ ] T26: Write integration tests for repositories using Testcontainers (PostgreSQL). `plant-typeorm-read.repository.spec.ts`: CRUD + cross-space isolation (plant in space A invisible in space B context). `plant-typeorm-write.repository.spec.ts`: save→findById round-trip, delete removes record. Run migrations before tests. Coverage: all public repo methods.

---

## Phase 4: Transport

- [ ] T17: Create REST DTOs in `src/contexts/plants/transport/rest/dtos/`: `create-plant.dto.ts` (name required, species/imageUrl @IsOptional @IsString), `update-plant.dto.ts` (all optional), `plant-rest-response.dto.ts` (@ApiProperty for all fields).
- [ ] T18: Create `src/contexts/plants/transport/rest/mappers/plant/plant.mapper.ts` — PlantRestMapper: `toResponse(vm: PlantViewModel): PlantRestResponseDto` 1:1 copy of all fields. Acceptance: all 8 fields present in output.
- [ ] T19: Create `src/contexts/plants/transport/rest/controllers/plants.controller.ts` — PlantsController @Controller('plants') @UseGuards(JwtAuthGuard): POST /plants (201, dispatches CreatePlantCommand via commandBus then re-queries via PlantFindByIdQuery), GET /plants (200, PlantFindByCriteriaQuery), GET /plants/:id (200, PlantFindByIdQuery), PATCH /plants/:id (200, UpdatePlantCommand + re-query), DELETE /plants/:id (200, DeletePlantCommand). @CurrentUser supplies userId for mutations. No @SkipSpace. Acceptance: all 5 endpoints respond with correct status codes.
- [ ] T20: Create GraphQL request DTOs in `src/contexts/plants/transport/graphql/dtos/requests/plant/`: `plant-create.request.dto.ts` (@InputType, name required), `plant-update.request.dto.ts` (@InputType, all optional + plantId), `plant-find-by-id.request.dto.ts`, `plant-find-by-criteria.request.dto.ts`, `plant-delete.request.dto.ts`.
- [ ] T21: Create GraphQL response DTOs in `src/contexts/plants/transport/graphql/dtos/responses/plant/`: `plant.response.dto.ts` (@ObjectType, @Field for all 8 fields), `paginated-plant-result.dto.ts` (extends BasePaginatedResultDto for PlantResponseDto). Create `src/contexts/plants/transport/graphql/mappers/plant/plant.mapper.ts` — PlantGraphQLMapper: `toResponseDtoFromViewModel(vm)` and `toPaginatedResponseDto(paginated)`.
- [ ] T22: Create `src/contexts/plants/transport/graphql/resolvers/plant/plant-queries.resolver.ts` — PlantQueriesResolver @Resolver @UseGuards(JwtAuthGuard, SpaceGuard): `plantFindById(input) → PlantResponseDto` (dispatches PlantFindByIdQuery), `plantsFindByCriteria(input) → PaginatedPlantResultDto` (dispatches PlantFindByCriteriaQuery). QueryBus only, no direct service injection.
- [ ] T23: Create `src/contexts/plants/transport/graphql/resolvers/plant/plant-mutations.resolver.ts` — PlantMutationsResolver @Resolver @UseGuards(JwtAuthGuard, SpaceGuard): `createPlant`, `updatePlant`, `deletePlant` → MutationResponseDto. **NOTE: confirm req.user accessor from GQL context** — use `@Context() ctx` and extract `ctx.req.user` (match pattern in UserMutationsResolver). userId MUST come from JWT, never from input. CommandBus only.
- [ ] T24: Create `src/contexts/plants/plants.module.ts` — PlantsModule: imports [CqrsModule, TypeOrmModule.forFeature([PlantTypeOrmEntity])]; controllers [PlantsController]; providers: [CreatePlantHandler, UpdatePlantHandler, DeletePlantHandler, PlantFindByIdHandler, PlantFindByCriteriaHandler, AssertPlantViewModelExistsService, AssertPlantExistsService, PlantBuilder, PlantTypeOrmMapper, {provide: PLANT_READ_REPOSITORY, useClass: PlantTypeOrmReadRepository}, {provide: PLANT_WRITE_REPOSITORY, useClass: PlantTypeOrmWriteRepository}, PlantRestMapper, PlantQueriesResolver, PlantMutationsResolver, PlantGraphQLMapper]. SpaceContext NOT declared (global via SharedModule). Add PlantsModule to `src/app.module.ts` imports. Create `src/contexts/plants/transport/graphql/enums/plant/plant-registered-enums.graphql.ts` (empty scaffold, side-effect import in module). Acceptance: app starts without DI errors; all providers resolved.

---

## Phase 5: E2E Tests + Verification

- [ ] T27: Write E2E tests in `test/plants/` (or co-located): REST `plants.e2e-spec.ts` — POST /plants (201 happy path, 400 empty name), GET /plants/:id (200 happy, 404 missing, cross-space 404), PATCH /plants/:id (200 owner, 403 non-owner), DELETE /plants/:id (200 owner, 403 non-owner), GET /plants (200 paginated). GraphQL `plants-graphql.e2e-spec.ts` — createPlant mutation (success + validation error), updatePlant (owner + forbidden), deletePlant (owner + forbidden), plantFindById (found + not found), plantsFindByCriteria (paginated). All tests run against migrations (not synchronize). Acceptance: all spec scenarios covered; tenant isolation asserted; ≥ 80% coverage for plants context.
