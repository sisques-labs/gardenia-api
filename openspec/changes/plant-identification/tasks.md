# Tasks: PlantIdentification bounded context (PlantNet integration)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2 000 – 2 500 (largest new-context change so far — 3 tables + external adapter + 3 cross-context ports) |
| 400-line budget risk | High (single-repo dev branch, not chained PRs per current workflow) |
| Delivery strategy | Single feature branch, multiple commits by phase |

## Phase 0: Provisioning (blocking, not code)

- [ ] 0.1 Obtain a PlantNet API key (my.plantnet.org) and confirm the daily
      quota tier; add to local `.env` (never commit the real key).
- [ ] 0.2 Make one live manual call to `POST /v2/identify/all` with a sample
      photo to confirm the exact response shape (`results[].species.
      scientificNameWithoutAuthor`/`commonNames`/`score`, or the actual
      field names — proposal.md/design.md assume a shape but it must be
      confirmed against a real response before Phase 3).

## Phase 1: Domain

- [ ] 1.1 `domain/enums/plant-identification-organ.enum.ts` — `leaf | flower | fruit | bark | habit | other`
- [ ] 1.2 `domain/enums/plant-identification-status.enum.ts` — `resolved | no_match`
- [ ] 1.3 `domain/value-objects/plant-identification-id/` (+ spec) — extends `UuidValueObject`
- [ ] 1.4 `domain/value-objects/plant-identification-status/` (+ spec) — extends `EnumValueObject<typeof PlantIdentificationStatusEnum>`
- [ ] 1.5 `domain/value-objects/plant-identification-organ/` (+ spec) — extends `EnumValueObject<typeof PlantIdentificationOrganEnum>`
- [ ] 1.6 `domain/value-objects/plant-identification-score/` (+ spec) — extends `NumberValueObject`, range 0–1
- [ ] 1.7 `domain/interfaces/plant-identification-photo.interface.ts` — `{ fileId, url, organ, position }`
- [ ] 1.8 `domain/interfaces/plant-identification-candidate.interface.ts` — `{ scientificName, commonNames, score, rank }`
- [ ] 1.9 `domain/interfaces/plant-identification.interface.ts` — `IPlantIdentification`, all scalar fields as value objects, `photos`/`candidates` as the interfaces above
- [ ] 1.10 `domain/primitives/plant-identification.primitives.ts` — `IPlantIdentificationPrimitives extends BasePrimitives`
- [ ] 1.11 `domain/events/interfaces/plant-identification-event-data.interface.ts`
- [ ] 1.12 `domain/events/plant-identification-created/plant-identification-created.event.ts`
- [ ] 1.13 `domain/events/plant-identification-converted-to-plant/plant-identification-converted-to-plant.event.ts`
- [ ] 1.14 `domain/exceptions/plant-identification-not-found.exception.ts` — 404
- [ ] 1.15 `domain/exceptions/plant-identification-forbidden.exception.ts` — 403
- [ ] 1.16 `domain/exceptions/plant-identification-not-resolved.exception.ts` — 409
- [ ] 1.17 `domain/exceptions/plant-identification-provider-unavailable.exception.ts` — 502
- [ ] 1.18 `domain/exceptions/plant-identification-quota-exceeded.exception.ts` — 429
- [ ] 1.19 `domain/view-models/plant-identification.view-model.ts` — `PlantIdentificationViewModel extends BaseViewModel`
- [ ] 1.20 `domain/repositories/write/plant-identification-write.repository.ts` — `IPlantIdentificationWriteRepository` + DI token; `save`, `findById`
- [ ] 1.21 `domain/repositories/read/plant-identification-read.repository.ts` — `IPlantIdentificationReadRepository` + DI token; `findById`, `findByCriteria`
- [ ] 1.22 `domain/aggregates/plant-identification.aggregate.ts` (+ spec) — `create()` → `PlantIdentificationCreatedEvent`; `convertToPlant(plantId)` → `PlantIdentificationConvertedToPlantEvent` (guard: throws if already converted); constructor = hydration only; no field-level `update()` beyond conversion
- [ ] 1.23 `domain/builders/plant-identification.builder.ts` (+ spec) — extends `BaseBuilder`; `withRequestedByUserId`, `withSpaceId`, `withStatus`, `withPhotos`, `withCandidates`, `withResolved`; `build()` + `buildViewModel()`

## Phase 2: Application

- [ ] 2.1 `application/ports/files.port.ts` — `IFilesPort` + DI token: `uploadFile(input): Promise<UploadedFileViewModel>` (mirrors `plant-photos`' own port)
- [ ] 2.2 `application/ports/plants.port.ts` — `IPlantsPort` + DI token: `createPlant(input: { name, gbifSpeciesKey?, speciesScientificName?, imageUrl?, userId }): Promise<{ id: string }>`
- [ ] 2.3 `application/ports/plant-species.port.ts` — `IPlantSpeciesPort` + DI token: `search(name: string, limit: number): Promise<{ gbifKey: number; scientificName: string }[]>` (read-only)
- [ ] 2.4 `application/ports/plantnet-identification.port.ts` — `IPlantNetIdentificationPort` + DI token: `identify(images: { content: Buffer; mimeType: string; organ: PlantIdentificationOrganEnum }[], project?: string): Promise<{ scientificName: string; commonNames: string[]; score: number }[]>`
- [ ] 2.5 `application/services/write/assert-plant-identification-exists/` (+ spec)
- [ ] 2.6 `application/services/write/assert-plant-identification-ownership/` (+ spec) — 403 if `requestingUserId !== requestedByUserId`
- [ ] 2.7 `application/commands/identify-plant/identify-plant.command.ts` — input: `photos: { filename, mimeType, size, content, organ }[]`, `project?`, `userId`, `spaceId`
- [ ] 2.8 `application/commands/identify-plant/identify-plant.result.ts` — `{ id, status, resolved: { gbifKey, scientificName } | null, candidates, photos, createdAt }`
- [ ] 2.9 `application/commands/identify-plant/identify-plant.handler.ts` (+ spec) — per design.md Data Flow: upload photos → PlantNet call (propagate provider/quota exceptions, no persistence on failure) → conditional GBIF resolve of top candidate → build+save aggregate → publish events
- [ ] 2.10 `application/commands/create-plant-from-identification/create-plant-from-identification.command.ts` — `{ identificationId, name, imageUrl?, requestingUserId }`
- [ ] 2.11 `application/commands/create-plant-from-identification/create-plant-from-identification.handler.ts` (+ spec) — assert exists + ownership; 409 if `resolved` is null; `plantsPort.createPlant(...)`; `identification.convertToPlant(plantId)`; save; publish
- [ ] 2.12 `application/queries/plant-identification-find-by-criteria/` — `.query.ts` + `.handler.ts` (+ spec), standard `Criteria` pattern (space-scoped)
- [ ] 2.13 `application/queries/plant-identification-find-by-id/` — `.query.ts` + `.handler.ts` (+ spec)

## Phase 3: Infrastructure

- [ ] 3.1 `infrastructure/adapters/files.adapter.ts` (+ spec) — implements `IFilesPort` via `CommandBus.execute(UploadFileCommand)`
- [ ] 3.2 `infrastructure/adapters/plants.adapter.ts` (+ spec) — implements `IPlantsPort` via `CommandBus.execute(CreatePlantCommand)`
- [ ] 3.3 `infrastructure/adapters/plant-species.adapter.ts` (+ spec) — implements `IPlantSpeciesPort` via `QueryBus.execute(GbifSpeciesSearchQuery)`
- [ ] 3.4 `infrastructure/adapters/plantnet-identification.adapter.ts` (+ spec, + `plantnet/types/plantnet-identify-api.types.ts`) — `POST /v2/identify/{project}?api-key=...`, multipart body (images + organs), 15s timeout; maps HTTP errors to the domain exceptions from 1.17/1.18 (429 → quota, everything else non-2xx/timeout → provider-unavailable); maps a successful response to `{ scientificName, commonNames, score }[]` per the shape confirmed in task 0.2
- [ ] 3.5 `infrastructure/persistence/typeorm/entities/plant-identification.entity.ts` — `plant_identifications` table
- [ ] 3.6 `infrastructure/persistence/typeorm/entities/plant-identification-photo.entity.ts` — `plant_identification_photos`, FK `ON DELETE CASCADE`
- [ ] 3.7 `infrastructure/persistence/typeorm/entities/plant-identification-candidate.entity.ts` — `plant_identification_candidates`, FK `ON DELETE CASCADE`
- [ ] 3.8 `infrastructure/persistence/typeorm/mappers/plant-identification-typeorm.mapper.ts` (+ spec) — `toDomain`/`toPersistence`/`toViewModel`, including nested photos/candidates arrays
- [ ] 3.9 `infrastructure/persistence/typeorm/repositories/plant-identification-typeorm-write.repository.ts` — `createTenantRepository`-wrapped; `save` persists parent + children in one transaction
- [ ] 3.10 `infrastructure/persistence/typeorm/repositories/plant-identification-typeorm-read.repository.ts` — `createTenantRepository`-wrapped; `findByCriteria` per the mandatory Criteria pattern (queryable-field enum + filterable-fields registry, see Phase 4)
- [ ] 3.11 `src/database/migrations/1780000000025-CreatePlantIdentifications.ts` — 3 tables + indexes per design.md; `down()` drops all three
- [ ] 3.12 `.env.example` — add `PLANTNET_API_KEY=`, `PLANTNET_PROJECT=all`, `PLANTNET_MIN_CONFIDENCE=0.2`
- [ ] 3.13 Config provider (`infrastructure/config/plantnet.config.ts` or reuse an existing pattern) validating `PLANTNET_API_KEY` is present at boot (fail fast, mirroring how `files`' S3 config validates required vars when `FILES_STORAGE_DRIVER=s3`)

## Phase 4: Transport

- [ ] 4.1 `transport/exceptions/plant-identification-exception.filter.ts` — `resolvePlantIdentificationExceptionStatus` (404/403/409/429/502 per design.md's error table); wire into `src/core/filters/base-exception.filter.ts`
- [ ] 4.2 `transport/graphql/enums/plant-identification-queryable-field.enum.ts` + `transport/graphql/registries/plant-identification-filterable-fields.registry.ts` (+ spec) — whitelist `status`, `requestedByUserId`, `createdAt` (exclude `spaceId`, implicit)
- [ ] 4.3 `transport/graphql/dtos/requests/plant-identification-filter.input.ts` + `-sort.input.ts` via `createFilterInput`/`createSortInput`
- [ ] 4.4 `transport/rest/dtos/identify-plant-response.dto.ts`, `plant-identification-rest-response.dto.ts`, `plant-identification-criteria.dto.ts`
- [ ] 4.5 `transport/rest/mappers/plant-identification/plant-identification.mapper.ts` (+ spec)
- [ ] 4.6 `transport/rest/controllers/plant-identifications.controller.ts` (+ spec) — `POST /plant-identifications` (multipart, `FilesInterceptor`, local hard-limit constant per photo, `photos[]` + `organs` JSON field per proposal.md open question #3), `GET /plant-identifications` (Criteria), `GET /plant-identifications/:id`
- [ ] 4.7 `transport/graphql/dtos/responses/plant-identification.response.dto.ts` (nested photo/candidate response types)
- [ ] 4.8 `transport/graphql/dtos/requests/create-plant-from-identification.request.dto.ts` + `plant-identification-find-by-criteria.request.dto.ts` (overrides `filters`/`sorts` per the mandatory Criteria DTO pattern)
- [ ] 4.9 `transport/graphql/mappers/plant-identification/plant-identification.mapper.ts` (+ spec)
- [ ] 4.10 `transport/graphql/resolvers/plant-identification/queries/plant-identification-queries.resolver.ts` (+ spec) — `plantIdentifications(input)`, `plantIdentification(id)`, wired with `FilterValidationPipe`
- [ ] 4.11 `transport/graphql/resolvers/plant-identification/mutations/plant-identification-mutations.resolver.ts` (+ spec) — `createPlantFromIdentification(input)` → `CreatedEntity`-shaped response (`{ id }`)
- [ ] 4.12 MCP: `mcp/schemas/*.ts` + `mcp/tools/*.ts` for find-by-criteria, find-by-id, create-plant-from-identification (no upload tool — matches `files`/`plant-photos` convention); wire name `plant_identification_*`
- [ ] 4.13 `plant-identification.module.ts` — grouped provider arrays per `openspec/config.yaml` convention; register all 4 ports via `useClass`
- [ ] 4.14 Register `PlantIdentificationModule` in `src/app.module.ts`
- [ ] 4.15 `plant-identification-no-cross-context-import.spec.ts` — guard test
- [ ] 4.16 `src/contexts/plant-identification/README.md` — full context README following `plant-photos`'/`care-log`'s README as template (purpose, aggregate, commands/queries, transport tables, cross-context integration ×3, DB, error handling, tests)

## Phase 5: Tests

- [ ] 5.1 Unit: all `.spec.ts` listed above green, including the PlantNet adapter's error-mapping (429 → quota exception, timeout/5xx → provider-unavailable, malformed payload handling)
- [ ] 5.2 Integration: `test/integration/plant-identification/` — tenant isolation on read/write repos, cascade delete of photos/candidates, `findByCriteria` filter/sort coverage
- [ ] 5.3 E2E: `test/e2e/plant-identification/` — REST multipart identify (mock PlantNet adapter: resolved path, no_match path, quota-429 path, provider-failure path), GraphQL history query + `createPlantFromIdentification` mutation (happy path, 409 on unresolved, 403 on non-owner), confirm a converted identification's `Plant` actually appears in `plants` with the right species link
- [ ] 5.4 `pnpm lint` && `pnpm tsc --noEmit` clean
- [ ] 5.5 `pnpm test:cov` ≥ 80% for the new context

## Phase 6: Docs

- [ ] 6.1 Write `openspec/specs/plant-identification/spec.md` on archive (per `openspec/config.yaml` archive rules) from this change's `specs/plant-identification/spec.md` delta
