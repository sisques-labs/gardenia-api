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
      **SKIPPED — cannot be done by an agent.** No real PlantNet API key was
      obtained or available in this environment.
- [ ] 0.2 Make one live manual call to `POST /v2/identify/all` with a sample
      photo to confirm the exact response shape (`results[].species.
      scientificNameWithoutAuthor`/`commonNames`/`score`, or the actual
      field names — proposal.md/design.md assume a shape but it must be
      confirmed against a real response before Phase 3).
      **SKIPPED — no live call was made.** `PlantNetIdentificationAdapter`
      and its types were implemented against the shape assumed in
      design.md, with a prominent banner comment in
      `infrastructure/adapters/plantnet/types/plantnet-identify-api.types.ts`
      (and in the context README) flagging that this MUST be verified
      against a real PlantNet response before production use.

## Phase 1: Domain

- [x] 1.1 `domain/enums/plant-identification-organ.enum.ts` — `leaf | flower | fruit | bark | habit | other`
- [x] 1.2 `domain/enums/plant-identification-status.enum.ts` — `resolved | no_match`
- [x] 1.3 `domain/value-objects/plant-identification-id/` (+ spec) — extends `UuidValueObject`
- [x] 1.4 `domain/value-objects/plant-identification-status/` (+ spec) — extends `EnumValueObject<typeof PlantIdentificationStatusEnum>`
- [x] 1.5 `domain/value-objects/plant-identification-organ/` (+ spec) — extends `EnumValueObject<typeof PlantIdentificationOrganEnum>`
- [x] 1.6 `domain/value-objects/plant-identification-score/` (+ spec) — extends `NumberValueObject`, range 0–1
- [x] 1.7 `domain/interfaces/plant-identification-photo.interface.ts` — `{ fileId, url, organ, position }`
- [x] 1.8 `domain/interfaces/plant-identification-candidate.interface.ts` — `{ scientificName, commonNames, score, rank }`
- [x] 1.9 `domain/interfaces/plant-identification.interface.ts` — `IPlantIdentification`, all scalar fields as value objects, `photos`/`candidates` as the interfaces above
- [x] 1.10 `domain/primitives/plant-identification.primitives.ts` — `IPlantIdentificationPrimitives extends BasePrimitives`
- [x] 1.11 `domain/events/interfaces/plant-identification-event-data.interface.ts`
- [x] 1.12 `domain/events/plant-identification-created/plant-identification-created.event.ts`
- [x] 1.13 `domain/events/plant-identification-converted-to-plant/plant-identification-converted-to-plant.event.ts`
- [x] 1.14 `domain/exceptions/plant-identification-not-found.exception.ts` — 404
- [x] 1.15 `domain/exceptions/plant-identification-forbidden.exception.ts` — 403
- [x] 1.16 `domain/exceptions/plant-identification-not-resolved.exception.ts` — 409
- [x] 1.17 `domain/exceptions/plant-identification-provider-unavailable.exception.ts` — 502
- [x] 1.18 `domain/exceptions/plant-identification-quota-exceeded.exception.ts` — 429
- [x] 1.19 `domain/view-models/plant-identification.view-model.ts` — `PlantIdentificationViewModel extends BaseViewModel`
- [x] 1.20 `domain/repositories/write/plant-identification-write.repository.ts` — `IPlantIdentificationWriteRepository` + DI token; `save`, `findById`
- [x] 1.21 `domain/repositories/read/plant-identification-read.repository.ts` — `IPlantIdentificationReadRepository` + DI token; `findById`, `findByCriteria`
- [x] 1.22 `domain/aggregates/plant-identification.aggregate.ts` (+ spec) — `create()` → `PlantIdentificationCreatedEvent`; `convertToPlant(plantId)` → `PlantIdentificationConvertedToPlantEvent` (guard: throws if already converted — added `PlantIdentificationAlreadyConvertedException`, not individually named in design.md's file tree but required by this exact guard instruction); constructor = hydration only; no field-level `update()` beyond conversion
- [x] 1.23 `domain/builders/plant-identification.builder.ts` (+ spec) — extends `BaseBuilder`; `withRequestedByUserId`, `withSpaceId`, `withStatus`, `withPhotos`, `withCandidates`, `withResolved` (+ `withConvertedToPlantId`, needed for the TypeORM mapper's round-trip); `build()` + `buildViewModel()`

## Phase 2: Application

- [x] 2.1 `application/ports/files.port.ts` — `IFilesPort` + DI token: `uploadFile(input): Promise<UploadedFileViewModel>` (mirrors `plant-photos`' own port)
- [x] 2.2 `application/ports/plants.port.ts` — `IPlantsPort` + DI token: `createPlant(input: { name, gbifSpeciesKey?, speciesScientificName?, imageUrl?, userId }): Promise<{ id: string }>`
- [x] 2.3 `application/ports/plant-species.port.ts` — `IPlantSpeciesPort` + DI token: `search(name: string, limit: number): Promise<{ gbifKey: number; scientificName: string }[]>` (read-only)
- [x] 2.4 `application/ports/plantnet-identification.port.ts` — `IPlantNetIdentificationPort` + DI token: `identify(images: { content: Buffer; mimeType: string; organ: PlantIdentificationOrganEnum }[], project?: string): Promise<{ scientificName: string; commonNames: string[]; score: number }[]>`
- [x] 2.5 `application/services/write/assert-plant-identification-exists/` (+ spec)
- [x] 2.6 `application/services/write/assert-plant-identification-ownership/` (+ spec) — 403 if `requestingUserId !== requestedByUserId`
- [x] 2.7 `application/commands/identify-plant/identify-plant.command.ts` — input: `photos: { filename, mimeType, size, content, organ }[]`, `project?`, `userId`, `spaceId`
- [x] 2.8 `application/commands/identify-plant/identify-plant.result.ts` — `{ id, status, resolved: { gbifKey, scientificName } | null, candidates, photos, createdAt }`
- [x] 2.9 `application/commands/identify-plant/identify-plant.handler.ts` (+ spec) — per design.md Data Flow: upload photos (parallel `Promise.all`) → PlantNet call (propagate provider/quota exceptions, no persistence on failure) → conditional GBIF resolve of top candidate → build+save aggregate → publish events
- [x] 2.10 `application/commands/create-plant-from-identification/create-plant-from-identification.command.ts` — `{ identificationId, name, imageUrl?, requestingUserId }`
- [x] 2.11 `application/commands/create-plant-from-identification/create-plant-from-identification.handler.ts` (+ spec) — assert exists + ownership; 409 if `resolved` is null; `plantsPort.createPlant(...)`; `identification.convertToPlant(plantId)`; save; publish
- [x] 2.12 `application/queries/plant-identification-find-by-criteria/` — `.query.ts` + `.handler.ts` (+ spec), standard `Criteria` pattern (space-scoped)
- [x] 2.13 `application/queries/plant-identification-find-by-id/` — `.query.ts` + `.handler.ts` (+ spec)

## Phase 3: Infrastructure

- [x] 3.1 `infrastructure/adapters/files.adapter.ts` (+ spec) — implements `IFilesPort` via `CommandBus.execute(UploadFileCommand)`
- [x] 3.2 `infrastructure/adapters/plants.adapter.ts` (+ spec) — implements `IPlantsPort` via `CommandBus.execute(CreatePlantCommand)`
- [x] 3.3 `infrastructure/adapters/plant-species.adapter.ts` (+ spec) — implements `IPlantSpeciesPort` via `QueryBus.execute(GbifSpeciesSearchQuery)`
- [x] 3.4 `infrastructure/adapters/plantnet-identification.adapter.ts` (+ spec, + `plantnet/types/plantnet-identify-api.types.ts`) — `POST /v2/identify/{project}?api-key=...`, multipart body (images + organs, native `FormData`/`Blob`), 15s timeout; maps HTTP errors to the domain exceptions from 1.17/1.18 (429 → quota, everything else non-2xx/timeout → provider-unavailable); maps a successful response to `{ scientificName, commonNames, score }[]`. ⚠️ **The exact response field names are UNVERIFIED — Phase 0 task 0.2 was skipped, see banner comment in the types file.**
- [x] 3.5 `infrastructure/persistence/typeorm/entities/plant-identification.entity.ts` — `plant_identifications` table
- [x] 3.6 `infrastructure/persistence/typeorm/entities/plant-identification-photo.entity.ts` — `plant_identification_photos`, FK `ON DELETE CASCADE`
- [x] 3.7 `infrastructure/persistence/typeorm/entities/plant-identification-candidate.entity.ts` — `plant_identification_candidates`, FK `ON DELETE CASCADE`
- [x] 3.8 `infrastructure/persistence/typeorm/mappers/plant-identification-typeorm.mapper.ts` (+ spec) — `toDomain`/`toPersistence`/`toViewModel`, including nested photos/candidates arrays
- [x] 3.9 `infrastructure/persistence/typeorm/repositories/plant-identification-typeorm-write.repository.ts` — `createTenantRepository`-wrapped; `save` persists parent + children in one transaction (`manager.transaction`, delete+reinsert children). **CI fix**: `save()` uses the raw `manager` (bypassing `createTenantRepository`'s `save` trap, which is what normally stamps the active `spaceId` onto the entity), so the aggregate's own `spaceId` was written as-is. `findById`/`findByCriteria` go through the tenant-scoped proxy and only ever see rows matching the *active* `SpaceContext`, so any write where the aggregate's `spaceId` didn't already equal the active context produced a row invisible to every subsequent tenant-scoped read/delete — this is exactly what the integration suite caught (`findById` returning null right after `save`, cascade-delete deleting 0 rows). Fixed by explicitly stamping `parent.spaceId = this.spaceContext.require()` before the transaction, matching what the proxy does everywhere else in this codebase.
- [x] 3.10 `infrastructure/persistence/typeorm/repositories/plant-identification-typeorm-read.repository.ts` — `createTenantRepository`-wrapped; `findByCriteria` per the mandatory Criteria pattern (queryable-field enum + filterable-fields registry, see Phase 4)
- [x] 3.11 `src/database/migrations/1780000000025-CreatePlantIdentifications.ts` — 3 tables + indexes per design.md; `down()` drops all three
- [x] 3.12 `.env.example` — add `PLANTNET_API_KEY=`, `PLANTNET_PROJECT=all`, `PLANTNET_MIN_CONFIDENCE=0.2`
- [x] 3.13 Config provider (`infrastructure/config/plantnet.config.ts`) validating `PLANTNET_API_KEY` is present at boot (fail fast, mirroring `files`' S3 config pattern). Also required adding a `PLANTNET_API_KEY` test default to `test/helpers/env-setup.ts` — otherwise this fail-fast breaks `AppModule` bootstrap for every e2e suite in the repo, not just this context's.

## Phase 4: Transport

- [x] 4.1 `transport/exceptions/plant-identification-exception.filter.ts` — `resolvePlantIdentificationExceptionStatus` (404/403/409/429/502 per design.md's error table, plus the `AlreadyConverted` guard also mapped to 409). **CI fix**: the resolver function existed but was never actually chained into `src/core/filters/base-exception.filter.ts`'s `resolveStatus()` — every domain exception from this context fell through to the generic 400 default. CI's REST e2e run caught this (429/502/404 tests all observed 400 instead); fixed by adding the missing import + chain call.
- [x] 4.2 `transport/graphql/enums/plant-identification-queryable-field.enum.ts` + `transport/graphql/registries/plant-identification-filterable-fields.registry.ts` (+ spec) — whitelist `status`, `requestedByUserId`, `createdAt` (exclude `spaceId`, implicit)
- [x] 4.3 `transport/graphql/dtos/requests/plant-identification-filter.input.ts` + `-sort.input.ts` via `createFilterInput`/`createSortInput`
- [x] 4.4 `transport/rest/dtos/identify-plant-response.dto.ts`, `plant-identification-rest-response.dto.ts`, `plant-identification-criteria.dto.ts`
- [x] 4.5 `transport/rest/mappers/plant-identification/plant-identification.mapper.ts` (+ spec)
- [x] 4.6 `transport/rest/controllers/plant-identifications.controller.ts` (+ spec) — `POST /plant-identifications` (multipart, `FilesInterceptor('photos', 5)`, local hard-limit constant per photo, `photos[]` + `organs` JSON field per proposal.md open question #3, resolved as: JSON-encoded array, index-aligned, validated in the controller), `GET /plant-identifications` (Criteria), `GET /plant-identifications/:id`
- [x] 4.7 `transport/graphql/dtos/responses/plant-identification.response.dto.ts` (nested photo/candidate response types)
- [x] 4.8 `transport/graphql/dtos/requests/create-plant-from-identification.request.dto.ts` + `plant-identification-find-by-criteria.request.dto.ts` (overrides `filters`/`sorts` per the mandatory Criteria DTO pattern)
- [x] 4.9 `transport/graphql/mappers/plant-identification/plant-identification.mapper.ts` (+ spec)
- [x] 4.10 `transport/graphql/resolvers/plant-identification/queries/plant-identification-queries.resolver.ts` (+ spec) — `plantIdentificationsFindByCriteria(input)`, `plantIdentificationFindById(input)`, wired with `FilterValidationPipe`
- [x] 4.11 `transport/graphql/resolvers/plant-identification/mutations/plant-identification-mutations.resolver.ts` (+ spec) — `createPlantFromIdentification(input)` → `{ id }` (via a dedicated `CreatedPlantFromIdentificationObject` GraphQL type — this repo has no shared `CreatedEntity` GraphQL object to reuse, unlike gardenia-web)
- [x] 4.12 MCP: `mcp/schemas/*.ts` + `mcp/tools/*.ts` (+ spec, going beyond the plan since `plant-photos`/`plant-species` don't all have tool specs, but several other contexts do) for find-by-criteria, find-by-id, create-plant-from-identification (no upload tool — matches `files`/`plant-photos` convention); wired as `plant_identification_find_by_id`, `plant_identification_find_by_criteria`, `plant_identification_create_plant`
- [x] 4.13 `plant-identification.module.ts` — grouped provider arrays per `openspec/config.yaml` convention; register all 4 ports via `useClass`
- [x] 4.14 Register `PlantIdentificationModule`. **Deviation from the literal task wording**: registered in `src/contexts/contexts.module.ts`'s `CONTEXT_MODULES` array, NOT directly in `src/app.module.ts` — the architecture skill's hard rule 7 ("New bounded context module → register it, don't wire it loose... Never import a context module directly in AppModule") supersedes proposal.md's Impact-table wording, and every other context in this repo is wired the same way.
- [x] 4.15 `plant-identification-no-cross-context-import.spec.ts` — guard test (covers `files`, `plants`, and `plant-species`)
- [x] 4.16 `src/contexts/plant-identification/README.md` — full context README following `plant-photos`'/`care-log`'s README as template, plus a prominent "Known gap: PlantNet response shape is UNVERIFIED" section

## Phase 5: Tests

- [x] 5.1 Unit: all `.spec.ts` green (94 tests across 29 suites in this context), including the PlantNet adapter's error-mapping (429 → quota exception, timeout/5xx → provider-unavailable)
- [ ] 5.2 Integration: `test/integration/plant-identification/` — tenant isolation on read/write repos, cascade delete of photos/candidates, `findByCriteria` filter/sort coverage. **Written, but NOT run** — no Postgres/Docker daemon available in this environment (`pnpm test:integration` fails at the `pretest:integration` connectivity check before tests even start; Docker socket unreachable, so Testcontainers can't be used as a fallback either).
- [ ] 5.3 E2E: `test/e2e/plant-identification/` — REST multipart identify (mock PlantNet adapter via a new `overrideProvider`-capable `createE2EApp()` — resolved/no_match/quota-429/provider-failure paths), GraphQL history query + `createPlantFromIdentification` mutation (happy path, 409 unresolved, 403 non-owner, confirms the converted `Plant` appears via `plants`' own REST endpoint). **Written, but NOT run** — same Docker/Postgres limitation as 5.2.
- [x] 5.4 `pnpm lint` && `pnpm tsc --noEmit` clean — both verified clean for every file this change touches (0 errors). Note: a full unscoped `pnpm lint --fix` run also touched ~67 pre-existing prettier violations in unrelated files (care-log, planting-spots, spaces, weather, qr, users, one old migration) that predate this change; those were deliberately left untouched to respect the file-scope restriction for this change, so a scoped `eslint` invocation (not the bare `pnpm lint` script) was used instead to verify.
- [ ] 5.5 `pnpm test:cov` ≥ 80% for the new context — **not met**: 79.82% statements / 70.54% branches / 69.64% functions / 78.95% lines on unit tests alone. The shortfall is structural, not a testing gap: the two TypeORM repositories (~240 lines) require a live Postgres to unit-test meaningfully and are instead covered by the (unrun) integration suite, and `plant-identification.module.ts`/the GraphQL enum-registration file are pure DI/registration wiring never unit-tested anywhere else in this codebase either. For comparison, the reference precedent context `plant-photos` sits at 55.97% under the same measurement — this change's coverage substantially exceeds that precedent despite not hitting the nominal 80% target.

## Phase 6: Docs

- [ ] 6.1 Write `openspec/specs/plant-identification/spec.md` on archive (per `openspec/config.yaml` archive rules) from this change's `specs/plant-identification/spec.md` delta. Not done — this is an archive-time step, out of scope for `apply`.
