# Design: Plant QR Generation (`qr` bounded context)

> Technical design for the `qr` bounded context and `plants` integration. Composes existing DDD + CQRS + Hexagonal patterns from `plants` and `spaces`. Product decisions captured in `explore.md` and `proposal.md`.

---

## Context

- **`plants`** is live: CRUD, dual REST + GraphQL, tenant isolation via `createTenantRepository` + `SpaceContext`.
- **Scan flow**: QR encodes a **frontend deep link**; the app enforces JWT + `X-Space-ID` when loading plant data — no public API route in MVP.
- **Storage**: PostgreSQL only; no S3. PNG stored as **BYTEA**.
- **Cross-context**: `PlantsModule` does **not** import `QrModule`. Communication via **`CommandBus`** only (pattern: `RegisterAccountCommandHandler` in auth).

---

## Goals / Non-Goals

**Goals:**

- New `qr` bounded context with `QrAggregate`, persistence, REST + GraphQL.
- 1:1 plant ↔ QR with `qrs.plant_id` UNIQUE and `plants.qr_id`.
- Auto-create QR on plant create; cascade delete on plant delete.
- Regenerate PNG in place (stable URL for printed labels).
- `QR_BASE_URL` config validated at boot.

**Non-Goals:**

- Public/anonymous scan endpoints or signed tokens.
- S3 / filesystem PNG storage.
- PNG bytes in GraphQL plant types or default plant list payloads.
- Backfill migration for legacy plants (separate change).
- QR types for non-plant entities.

---

## Decisions

### ADR-1: Separate `qr` bounded context

**Decision:** `src/contexts/qr/` as its own module, not a subfolder of `plants`.

**Rationale:** QR has its own aggregate, persistence, and transport; may later serve other entities. Keeps `plants` focused on plant domain.

**Alternatives:** Embed QR logic in `plants` application layer — rejected (violates bounded context boundaries).

---

### ADR-2: Dual FK (qrs.plant_id + plants.qr_id)

**Decision:**

- `qrs.plant_id` UUID UNIQUE NOT NULL — canonical 1:1 from QR side.
- `plants.qr_id` UUID nullable — denormalized pointer for fast plant reads.

**Rationale:** Queries by plant are common; avoid join-only lookups on every plant list.

---

### ADR-3: Synchronous CommandBus orchestration on create

**Decision:** `CreatePlantCommandHandler` flow:

```text
1. save plant + publish PlantCreated events
2. qrId = await commandBus.execute(CreateQrForPlantCommand({ plantId, spaceId }))
3. await commandBus.execute(SetPlantQrIdCommand({ plantId, qrId }))
4. return plantId
```

**Rationale:** No `@EventsHandler` pattern in repo; auth already chains commands; create response can include `qrId` without eventual consistency.

**Alternatives:** `PlantCreatedEvent` handler — rejected (no precedent).

**Risk:** No distributed transaction → plant without QR if step 2 fails.

**Mitigation v1:** Let create fail after plant save (document inconsistency); v2: compensating `DeletePlant` or retry job.

```text
CreatePlantHandler                    QrModule
      │                                  │
      ├─ save plant ─────────────────────┤
      ├─ CreateQrForPlantCommand ───────►│ create QrAggregate
      │                                  │ generate URL + PNG
      │◄──────────── qrId ───────────────┤ persist qrs
      ├─ SetPlantQrIdCommand ───────────►│ update plants.qr_id
      └─ return plantId
```

---

### ADR-4: Regenerate semantics

| Field | On regenerate |
|-------|----------------|
| `id` | Unchanged |
| `target_url` | Unchanged |
| `png_image` | Replaced |
| `generation` | Incremented by 1 |
| Event | `QrRegeneratedEvent` |

**Rationale:** Printed labels keep working; only the downloadable image changes.

---

### ADR-5: PNG in PostgreSQL BYTEA

**Decision:** `qrs.png_image` BYTEA; TypeORM `Buffer`; domain aggregate **excludes** raw bytes.

**Rationale:** Matches stack; binary-efficient vs base64 text.

**Port:** `IQrPngGenerator` (domain/application port) + `QrPngGeneratorService` (infra, uses `qrcode`).

---

### ADR-6: Target URL shape

**Decision:** `{QR_BASE_URL}/plants/{plantId}?spaceId={spaceId}`

- `QR_BASE_URL` from `src/core/config/app.config.ts` (trim trailing slash).
- Persisted at create time in `qrs.target_url`.
- **Not** an API URL (`/api/plants/...`).

**Config:** Application MUST fail boot if `QR_BASE_URL` is unset.

---

### ADR-7: Cross-module wiring

```text
AppModule
  ├── PlantsModule   (exports nothing from qr)
  └── QrModule       (exports command classes for CommandBus)
```

- `CreateQrForPlantCommand`, `SetPlantQrIdCommand`, `DeleteQrByPlantIdCommand` registered in respective modules.
- QR repos use `createTenantRepository(rawRepo, spaceContext)` on `space_id`.

---

### ADR-8: Transport split — metadata vs image

| Surface | Returns |
|---------|---------|
| `GET /qrs/:id` | JSON metadata (`id`, `plantId`, `spaceId`, `targetUrl`, `generation`, timestamps) |
| `GET /qrs/:id/image` | `image/png` (`StreamableFile`) |
| GraphQL queries | Metadata only (no bytes) |

---

## Domain Layer (`qr`)

### `QrAggregate` (extends `BaseAggregate`)

**Fields (private):**

- `_id: QrIdValueObject`
- `_plantId: UuidValueObject` (readonly)
- `_spaceId: UuidValueObject` (readonly)
- `_targetUrl: QrTargetUrlValueObject`
- `_generation: number` (starts at 1)

**Methods:**

- `create(): void` → `QrCreatedEvent`
- `regenerate(): void` → increments generation, `QrRegeneratedEvent` (PNG swap happens in handler before/after save)
- `delete(): void` → `QrDeletedEvent`

**No PNG in aggregate** — bytes only in infrastructure entity/mapper.

### Value objects

| VO | Rules |
|----|-------|
| `QrIdValueObject` | extends `UuidValueObject` |
| `QrTargetUrlValueObject` | extends `StringValueObject`, max 2000 chars |

### Exceptions

| Exception | HTTP |
|-----------|------|
| `QrNotFoundException` | 404 |
| `QrAlreadyExistsForPlantException` | 409 |
| `QrPlantNotInSpaceException` | 403 |

Register all in `base-exception.filter.ts`.

---

## Application Layer (`qr`)

### Commands

| Command | Handler responsibility |
|---------|------------------------|
| `CreateQrForPlantCommand` | Assert no existing QR for plant; build URL; generate PNG; save; return `qrId` |
| `RegenerateQrCommand` | Load QR; regenerate PNG; `aggregate.regenerate()`; save |
| `DeleteQrByPlantIdCommand` | Find by `plant_id`; delete row |

### Queries

| Query | Returns |
|-------|---------|
| `QrFindByIdQuery` | `QrViewModel` (no bytes) |
| `QrFindByPlantIdQuery` | `QrViewModel \| null` |
| `QrFindPngByIdQuery` | `Buffer` (infra read repo) |

### Services

- `AssertQrExistsService` (write)
- `AssertQrViewModelExistsService` (read)

---

## Infrastructure (`qr`)

### Entity `qrs`

```sql
CREATE TABLE qrs (
  id UUID PRIMARY KEY,
  plant_id UUID NOT NULL UNIQUE,
  space_id UUID NOT NULL,
  target_url VARCHAR(2000) NOT NULL,
  png_image BYTEA NOT NULL,
  generation INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_qrs_space_id ON qrs(space_id);
```

### Migrations

1. `{timestamp}-CreateQrs.ts`
2. `{timestamp}-AddQrIdToPlants.ts` — `qr_id UUID NULL` (no FK constraint required per plants convention, or optional FK to `qrs.id`)

### Plants changes

- `PlantTypeOrmEntity`: `qrId` column nullable
- `PlantAggregate` / primitives / view-model: optional `qrId`
- `SetPlantQrIdCommand` in plants application layer
- `CreatePlantCommandHandler`: orchestration (see ADR-3)
- `DeletePlantCommandHandler`: `DeleteQrByPlantIdCommand` before or after plant delete

---

## Transport (`qr`)

Mirror `plants` structure:

```
src/contexts/qr/transport/
├── rest/controllers/qrs.controller.ts
├── rest/dtos/...
├── graphql/resolvers/qr/qr-queries.resolver.ts
├── graphql/resolvers/qr/qr-mutations.resolver.ts
└── graphql/mappers/qr/qr.mapper.ts
```

**Guards:** `JwtAuthGuard` + `SpaceGuard` on all endpoints (no `@SkipSpace`).

---

## Plants enrichment

| DTO / type | Added fields |
|------------|--------------|
| `PlantRestResponseDto` | `qrId?: string`, `targetUrl?: string` |
| `PlantResponseDto` (GraphQL) | same |

Populate via join/lookup in query handlers or optional `EnrichPlantWithQrService` in plants read layer calling `QrFindByPlantIdQuery` — design prefers **read-side enrichment in plant query handlers** to avoid N+1 in list (batch by `qrId` or left join in read repo v2; MVP: per-item lookup acceptable if list size small, or include `target_url` denormalized on plant VM later).

**MVP recommendation:** store `qrId` on plant; resolve `targetUrl` via single QR query in `PlantFindById`; for criteria list, batch fetch QR metadata by `qrId` list in handler.

---

## File Tree (new + modified)

```
src/contexts/qr/                          (new — full tree per architecture skill)
src/contexts/plants/
  domain/...                              (+ qrId)
  application/commands/set-plant-qr-id/   (new)
  application/commands/create-plant/      (orchestration)
  application/commands/delete-plant/      (cascade)
  infrastructure/.../plant.entity.ts      (+ qrId)
  transport/...                           (+ qrId, targetUrl fields)
src/core/config/app.config.ts             (+ qrBaseUrl)
src/database/migrations/                  (2 new)
src/app.module.ts                         (+ QrModule)
src/core/filters/base-exception.filter.ts (+ Qr exceptions)
package.json                              (+ qrcode)
```

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Plant without QR after partial failure | Document; monitor; v2 saga |
| N+1 QR lookups on plant list | Batch query in handler or denormalize `targetUrl` on plant VM |
| Large PNG in BYTEA | `qrcode` defaults (~few KB); cap error size in generator |
| Wrong `QR_BASE_URL` in prod | Boot validation + `.env.example` |
| Exception filter miss → 400 | Register QR exceptions in same PR as domain |

---

## Migration Plan

1. Deploy migration `CreateQrs` + `AddQrIdToPlants` (nullable `qr_id` — safe for existing rows).
2. Deploy API with `QrModule`; new plants get QR automatically.
3. Existing plants: `qr_id` NULL until backfill (out of scope).

**Rollback:** reverse migrations; revert code PRs.

---

## Open Questions

1. Frontend route confirmation (`/plants/{id}?spaceId=` vs nested path).
2. List enrichment strategy — batch vs denormalize `targetUrl` on `plants` table (future optimization).
