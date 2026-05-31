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
- 1:1 plant ↔ QR via `plants.qr_id` only; `qrs` rows are generic (no `plant_id`).
- Auto-create QR on plant create; cascade delete on plant delete.
- Regenerate PNG in place (stable URL for printed labels).
- `QR_BASE_URL` config validated at boot.

**Non-Goals:**

- Public/anonymous scan endpoints or signed tokens.
- S3 / filesystem PNG storage.
- PNG bytes in GraphQL plant types or default plant list payloads.
- Backfill migration for legacy plants (separate change).
- Additional consumer types beyond plants (plants is first consumer only).

---

## Decisions

### ADR-1: Separate `qr` bounded context

**Decision:** `src/contexts/qr/` as its own module, not a subfolder of `plants`.

**Rationale:** QR has its own aggregate, persistence, and transport; may later serve other entities. Keeps `plants` focused on plant domain.

**Alternatives:** Embed QR logic in `plants` application layer — rejected (violates bounded context boundaries).

---

### ADR-2: Link only on `plants.qr_id` + DB trigger

**Decision:**

- `plants.qr_id` UUID nullable UNIQUE — FK → `qrs(id) ON DELETE SET NULL`.
- `qrs` has **no** `plant_id` column; the QR aggregate stays generic.
- `BEFORE DELETE` trigger on `plants` deletes the linked QR row when `qr_id` is set.

**Rationale:** Referential integrity and orphan prevention without denormalizing plant identity onto `qrs`.

---

### ADR-3: Synchronous CommandBus orchestration on create

**Decision:** `CreatePlantCommandHandler` flow:

```text
1. save plant + publish PlantCreated events
2. targetUrl = PlantQrTargetUrlBuilder.build(plantId, spaceId)
3. qrId = await commandBus.execute(CreateQrCommand({ targetUrl, spaceId }))
4. await commandBus.execute(SetPlantQrIdCommand({ plantId, qrId }))
5. return plantId
```

**Rationale:** No `@EventsHandler` pattern in repo; auth already chains commands; create response can include `qrId` without eventual consistency.

**Alternatives:** `PlantCreatedEvent` handler — rejected (no precedent).

**Risk:** No distributed transaction → plant without QR if step 2 fails.

**Mitigation v1:** Let create fail after plant save (document inconsistency); v2: compensating `DeletePlant` or retry job.

```text
CreatePlantHandler                    QrModule
      │                                  │
      ├─ save plant ─────────────────────┤
      ├─ CreateQrCommand ────────────────►│ create QrAggregate
      │   (targetUrl from plants)        │ generate PNG
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

**Decision:** Plants build `{QR_BASE_URL}/plants/{plantId}?spaceId={spaceId}` via `PlantQrTargetUrlBuilderService` and pass it to `CreateQrCommand`.

- `QR_BASE_URL` from `src/core/config/app.config.ts` (trim trailing slash).
- Persisted in `qrs.target_url` as supplied by the caller.
- **Not** an API URL (`/api/plants/...`).

**Config:** Application MUST fail boot if `QR_BASE_URL` is unset.

---

### ADR-7: Cross-module wiring

```text
AppModule
  ├── PlantsModule   (exports nothing from qr)
  └── QrModule       (exports command classes for CommandBus)
```

- `CreateQrCommand`, `SetPlantQrIdCommand`, `DeleteQrCommand` registered in respective modules.
- QR repos use `createTenantRepository(rawRepo, spaceContext)` on `space_id`.

---

### ADR-8: Transport split — metadata vs image

| Surface | Returns |
|---------|---------|
| `GET /qrs/:id` | JSON metadata (`id`, `spaceId`, `targetUrl`, `generation`, timestamps) |
| `GET /qrs/:id/image` | `image/png` (`StreamableFile`) |
| GraphQL queries | Metadata only (no bytes) |

---

## Domain Layer (`qr`)

### `QrAggregate` (extends `BaseAggregate`)

**Fields (private):**

- `_id: QrIdValueObject`
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

Register all in `base-exception.filter.ts`.

---

## Application Layer (`qr`)

### Commands

| Command | Handler responsibility |
|---------|------------------------|
| `CreateQrCommand` | Accept `targetUrl` + `spaceId`; generate PNG; save; return `qrId` |
| `RegenerateQrCommand` | Load QR; regenerate PNG; `aggregate.regenerate()`; save |
| `DeleteQrCommand` | Delete by `qrId` (idempotent) |

### Queries

| Query | Returns |
|-------|---------|
| `QrFindByIdQuery` | `QrViewModel` (no bytes) |
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
2. `{timestamp}-LinkPlantsToQrs.ts` — `plants.qr_id`, FK to `qrs`, unique constraint, delete trigger

### Plants changes

- `PlantTypeOrmEntity`: `qrId` column nullable
- `PlantAggregate` / primitives / view-model: optional `qrId`
- `SetPlantQrIdCommand` in plants application layer
- `CreatePlantCommandHandler`: orchestration (see ADR-3)
- `DeletePlantCommandHandler`: `DeleteQrCommand` when `plant.qrId` is set, then delete plant (DB trigger as safety net)
- `PlantQrTargetUrlBuilderService` in plants application layer

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

Populate via `EnrichPlantWithQrService` calling `QrFindByIdQuery` when `plant.qrId` is set — batch by `qrId` list in list handlers when N+1 becomes an issue.

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

1. Deploy migration `CreateQrs` + `LinkPlantsToQrs` (nullable `qr_id` — safe for existing rows).
2. Deploy API with `QrModule`; new plants get QR automatically.
3. Existing plants: `qr_id` NULL until backfill (out of scope).

**Rollback:** reverse migrations; revert code PRs.

---

## Open Questions

1. Frontend route confirmation (`/plants/{id}?spaceId=` vs nested path).
2. List enrichment strategy — batch vs denormalize `targetUrl` on `plants` table (future optimization).
