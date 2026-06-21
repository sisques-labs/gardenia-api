# QR Module

Manages QR code generation, storage, and retrieval for the Gardenia platform. When a plant is created, the QR module automatically generates a PNG image encoding a deep-link URL to that plant's detail page. The image is stored as binary data in PostgreSQL and can be downloaded directly or regenerated on demand.

---

## Quick orientation

```
src/contexts/qr/
├── application/
│   ├── commands/          # create-qr, regenerate-qr, delete-qr
│   └── queries/           # qr-find-by-id, qr-find-png-by-id
├── domain/
│   ├── aggregates/        # QrAggregate
│   ├── builders/          # QrBuilder
│   ├── events/            # QrCreatedEvent, QrRegeneratedEvent, QrDeletedEvent
│   ├── primitives/        # IQrPrimitives
│   ├── repositories/      # IQrReadRepository, IQrWriteRepository
│   ├── value-objects/     # QrIdValueObject, QrTargetUrlValueObject, QrGenerationValueObject
│   └── view-models/       # QrViewModel
├── infrastructure/
│   ├── persistence/typeorm/   # entity, mapper, read/write repositories
│   └── services/              # QrPngGeneratorService (wraps qrcode library)
└── transport/
    ├── rest/              # QrsController, DTOs, mapper
    └── graphql/           # QrQueriesResolver, QrMutationsResolver, DTOs
```

---

## How a QR is created

The QR module does not expose a "create" REST endpoint directly — creation is always triggered by the Plants context when a plant is saved.

```
POST /api/plants
  └─ CreatePlantCommandHandler
       ├─ generates plantId
       ├─ builds targetUrl: {QR_BASE_URL}/plants/{plantId}?spaceId={spaceId}
       ├─ executes CreateQrCommand → QR module
       │    ├─ QrPngGeneratorService.generate(targetUrl)  → Buffer (PNG)
       │    ├─ persists QrAggregate + PNG to `qrs` table
       │    ├─ publishes QrCreatedEvent
       │    └─ returns qrId
       ├─ builds PlantAggregate with qrId already set
       └─ persists plant
```

The PNG is stored as a `bytea` column alongside the metadata. There is no file storage or external service involved.

---

## REST API

All endpoints require a valid JWT (`JwtAuthGuard`).

| Method | Path | Response | Description |
|--------|------|----------|-------------|
| `GET` | `/qrs/:id` | `QrRestResponseDto` | QR metadata (no image) |
| `GET` | `/qrs/:id/image` | `image/png` stream | Download the PNG directly |
| `POST` | `/qrs/:id/regenerate` | `204 No Content` | Re-render PNG, increment generation counter |

### QrRestResponseDto

```ts
{
  id: string;
  spaceId: string;
  targetUrl: string;
  generation: number;
  createdAt: Date;
  updatedAt: Date;
}
```

The PNG is never returned in JSON responses — use `GET /qrs/:id/image` for the binary.

---

## GraphQL API

| Operation | Type | Input | Output |
|-----------|------|-------|--------|
| `qrFindById` | Query | `{ id: UUID }` | `QrResponseDto` |
| `qrRegenerate` | Mutation | `{ id: UUID }` | `MutationResponseDto` |

---

## Domain model

### QrAggregate

| Field | Type | Notes |
|-------|------|-------|
| `id` | `QrIdValueObject` | UUID, immutable |
| `spaceId` | `UuidValueObject` | Tenant owner, immutable |
| `targetUrl` | `QrTargetUrlValueObject` | Max 2000 chars, immutable after creation |
| `generation` | `QrGenerationValueObject` | Starts at 1, increments on regenerate |
| `createdAt` | `DateValueObject` | |
| `updatedAt` | `DateValueObject` | |

### Key invariants

- `targetUrl` is **immutable** — regenerating a QR rewrites the PNG but keeps the same URL.
- `generation` is incremented on every `regenerate` call. It tracks how many times the image was re-rendered.
- There is no soft delete — `DeleteQrCommand` hard-deletes the row.

---

## Commands

### `CreateQrCommand`

**Input**: `{ targetUrl: string, spaceId: string }`  
**Returns**: `string` (the new QR ID)  
**Side effects**: inserts row into `qrs`, publishes `QrCreatedEvent`

### `RegenerateQrCommand`

**Input**: `{ qrId: string }`  
**Returns**: `void`  
**Side effects**: overwrites the `pngImage` column, increments `generation`, publishes `QrRegeneratedEvent`

### `DeleteQrCommand`

**Input**: `{ qrId: string }`  
**Returns**: `void`  
**Side effects**: hard-deletes row from `qrs`, publishes `QrDeletedEvent`

---

## Queries

### `QrFindByIdQuery` → `QrViewModel | null`

Returns metadata only. Does not load the PNG column.

### `QrFindPngByIdQuery` → `Buffer | null`

Returns raw PNG bytes. Uses a column projection (`select: { id, pngImage, spaceId }`) to avoid loading unneeded fields. Used by `GET /qrs/:id/image` and by the Plants context when building `PlantQrViewModel`.

---

## Plants integration

The Plants context reads QR data through `IPlantQrPort`, defined in `plants/application/ports/plant-qr.port.ts`. This keeps the Plants application layer decoupled from the QR module internals.

`PlantQrAdapter` (in `plants/infrastructure/`) implements the port by dispatching both `QrFindByIdQuery` (metadata) and `QrFindPngByIdQuery` (PNG) via the shared `QueryBus`. The PNG is base64-encoded and returned as part of `PlantQrViewModel`, which is embedded in `PlantViewModel.qr`.

```
PlantFindByIdQuery → EnrichPlantWithQrService
  └─ IPlantQrPort.findByQrId(qrId)
       └─ PlantQrAdapter
            ├─ QrFindByIdQuery     → QrViewModel (metadata)
            └─ QrFindPngByIdQuery  → Buffer → base64
            → PlantQrViewModel { id, spaceId, targetUrl, generation, image, ... }
```

---

## Database

Table: **`qrs`**

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `space_id` | `uuid` | Indexed; used for tenant scoping |
| `target_url` | `varchar(2000)` | The URL encoded in the QR image |
| `png_image` | `bytea` | Raw PNG binary |
| `generation` | `int` | Starts at 1 |
| `created_at` | `timestamp` | |
| `updated_at` | `timestamp` | |

Migration: `src/database/migrations/1780000000006-CreateQrsTable.ts`

All repository queries are scoped to the active space via `SpaceContext` (tenant isolation).

---

## Things to know before making changes

- **PNG is stored inline** — no S3, no file system. If the `bytea` approach becomes a bottleneck at scale, the migration path is to move to object storage and store a URL reference instead.
- **No update endpoint** — the target URL cannot be changed after creation. To change where a QR points, delete and recreate.
- **Cross-module dispatch** — `PlantQrAdapter` dispatches QR queries through the global `QueryBus`. This works because `CqrsModule` is global in NestJS. No direct `QrModule` import is needed in `PlantsModule`.
- **`qrId` lives in the plant row** — the `plants` table has a `qr_id` FK column. Deleting a plant also deletes its linked QR via a database trigger (`delete_qr_when_plant_deleted`).

## MCP Tools

Exposed under `transport/mcp/` for AI clients (see `src/core/mcp/README.md`). Each tool dispatches through the Command/Query bus; the active space comes from the authenticated MCP request context.

| Tool | Action |
|------|--------|
| `qr_create` | Create a QR code |
| `qr_regenerate` | Regenerate a QR code |
| `qr_delete` | Delete a QR code |
| `qr_find_by_id` | Get a QR code by id |
