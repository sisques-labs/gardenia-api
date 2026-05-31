# Tasks: Plant QR Generation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 650–900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1: qr domain+infra · PR2: qr transport · PR3: plants integration |
| Delivery strategy | chained-PRs |
| Chain strategy | sequential |

---

## PR 1: `qr` bounded context — domain, config, persistence

### 1.1 Config and dependencies

- [x] 1.1 Add `qrcode` (and `@types/qrcode` if required) to `package.json`
- [x] 1.2 Create `src/core/config/app.config.ts` with `qrBaseUrl` from `QR_BASE_URL` — fail boot if missing; document in `.env.example`

### 1.2 Domain layer (`src/contexts/qr/domain/`)

- [x] 1.3 Create `QrAggregate`, `IQr`, `IQrPrimitives`, `QrViewModel`, `QrBuilder`
- [x] 1.4 Create VOs: `QrIdValueObject`, `QrTargetUrlValueObject`
- [x] 1.5 Create events: `QrCreatedEvent`, `QrRegeneratedEvent`, `QrDeletedEvent`
- [x] 1.6 Create exceptions: `QrNotFoundException`, `QrAlreadyExistsForPlantException` — register in `base-exception.filter.ts`
- [x] 1.7 Create read/write repository interfaces + DI tokens

### 1.3 Application layer

- [x] 1.8 Create `CreateQrForPlantCommand` + handler (URL build, PNG gen, save)
- [x] 1.9 Create `RegenerateQrCommand` + handler
- [x] 1.10 Create `DeleteQrByPlantIdCommand` + handler
- [x] 1.11 Create `QrFindByIdQuery`, `QrFindByPlantIdQuery`, `QrFindPngByIdQuery` + handlers
- [x] 1.12 Create `IQrPngGenerator` port + `AssertQrExists` / `AssertQrViewModelExists` services
- [x] 1.13 Unit specs: aggregate, handlers (mocked repos + PNG generator)

### 1.4 Infrastructure

- [x] 1.14 Create `QrTypeOrmEntity` (`qrs` table: id, plant_id UNIQUE, space_id, target_url, png_image BYTEA, generation, timestamps)
- [x] 1.15 Create migration `{timestamp}-CreateQrs.ts`
- [x] 1.16 Create `QrTypeOrmMapper`, read/write repositories with `createTenantRepository`
- [x] 1.17 Create `QrPngGeneratorService` implementing `IQrPngGenerator` using `qrcode`
- [x] 1.18 Create `qr.module.ts` — wire domain, handlers, repos, config; export command/query classes for CommandBus
- [x] 1.19 Register `QrModule` in `AppModule`
- [x] 1.20 Integration spec: QR persistence + tenant isolation (`test/integration/qr/`)

---

## PR 2: `qr` transport — REST + GraphQL

### 2.1 REST

- [x] 2.1 Create `QrsController` — `GET /:id`, `GET /:id/image`, `GET /by-plant/:plantId`, `POST /:id/regenerate`
- [ ] 2.2 Create REST DTOs + `QrRestMapper` + response types (metadata only)
- [ ] 2.3 Unit specs: controller (mocked buses), mapper

### 2.2 GraphQL

- [ ] 2.4 Create `QrResponseDto`, `qr-registered-enums.graphql.ts` scaffold
- [ ] 2.5 Create `QrQueriesResolver` (`qrFindById`, `qrFindByPlantId`)
- [ ] 2.6 Create `QrMutationsResolver` (`qrRegenerate`)
- [ ] 2.7 Create `QrGraphQLMapper` + unit specs
- [ ] 2.8 Wire `GRAPHQL_PROVIDERS` + `REST_PROVIDERS` in `qr.module.ts`

### 2.3 E2E (qr-only)

- [ ] 2.9 E2E: create plant fixture path or seed QR via command — GET metadata + GET image PNG (`test/e2e/qr/` or extend plants e2e in PR3)

---

## PR 3: `plants` integration

### 3.1 Schema and domain

- [ ] 3.1 Migration `{timestamp}-AddQrIdToPlants.ts` — nullable `qr_id` on `plants`
- [ ] 3.2 Add `qrId` to `PlantTypeOrmEntity`, aggregate, primitives, view-model, builder, mappers

### 3.2 Application orchestration

- [ ] 3.3 Create `SetPlantQrIdCommand` + handler
- [ ] 3.4 Modify `CreatePlantCommandHandler` — after save: `CreateQrForPlantCommand` → `SetPlantQrIdCommand`
- [ ] 3.5 Modify `DeletePlantCommandHandler` — dispatch `DeleteQrByPlantIdCommand`
- [ ] 3.6 Enrich `PlantFindById` / `PlantFindByCriteria` handlers with `targetUrl` (via `QrFindByPlantId` or batch)
- [ ] 3.7 Unit specs: create-plant orchestration (mock CommandBus), delete cascade

### 3.3 Transport

- [ ] 3.8 Add `qrId`, `targetUrl` to `PlantRestResponseDto` + REST mapper
- [ ] 3.9 Add `qrId`, `targetUrl` to `PlantResponseDto` + GraphQL mapper
- [ ] 3.10 Update transport unit specs

### 3.4 E2E

- [ ] 3.11 E2E: POST /plants → response includes qrId + targetUrl; GET /qrs/:id/image returns PNG
- [ ] 3.12 E2E: POST /qrs/:id/regenerate increments generation; DELETE /plants removes QR

---

## Post-MVP (not in this change)

- [ ] Backfill script for existing plants without QR
- [ ] Batch QR enrichment for plant list (N+1 optimization)
- [ ] Confirm/update frontend route in `QR_BASE_URL` docs
