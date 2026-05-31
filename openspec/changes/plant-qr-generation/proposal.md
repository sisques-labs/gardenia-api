# Proposal: Plant QR Generation (`qr` bounded context)

## Why

Gardenia users need a scannable label per plant that opens the **web plant detail page** inside the authenticated app. Each plant must get a **stable deep link** and a **persisted PNG** automatically at creation time, with the ability to **regenerate** the image later (same URL, new bitmap). The initial MVP idea (a derived `qrUrl` field without persistence) is insufficient: product requires a dedicated **`qr` module**, stored URL + PNG, and a `qrId` link on plants.

Why now: the `plants` bounded context is complete (REST + GraphQL, tenant-scoped). QR is the first cross-context feature that composes plants with a new aggregate and binary storage, and it unblocks physical labeling workflows before the frontend detail page ships.

## What Changes

- Introduce new bounded context **`qr`** under `src/contexts/qr/` (DDD + CQRS + Hexagonal).
- New table **`qrs`**: `id`, `plant_id` (UNIQUE), `space_id`, `target_url`, `png_image` (BYTEA), `generation`, timestamps.
- Add nullable **`qr_id`** column on **`plants`** table and aggregate/view-model/DTO fields.
- Config **`QR_BASE_URL`** (required at boot; localhost acceptable in dev).
- **Auto-create** QR on `CreatePlant` via synchronous `CommandBus` orchestration (`CreateQrForPlantCommand` → `SetPlantQrIdCommand`).
- **Regenerate** command: same `id` + `target_url`, replace PNG, increment `generation`.
- **Delete cascade**: removing a plant deletes its linked QR.
- REST + GraphQL transport for QR metadata; REST `GET /qrs/:id/image` returns `image/png`.
- Enrich plant REST/GraphQL responses with `qrId` and `targetUrl` (no PNG bytes in plant payloads).
- Dependency: `qrcode` npm package for PNG generation.
- Register `QrModule` in `AppModule`; register QR exceptions in `BaseExceptionFilter`.

**Not in scope (MVP):**

- Anonymous / public API routes for scanning without JWT.
- Signed share tokens, S3 upload, base64 in GraphQL plant types.
- Backfill script for plants created before this change.

## Capabilities

### New Capabilities

- `qr`: QR aggregate lifecycle — create for plant, read metadata, download PNG, regenerate, delete by plant; tenant-scoped via `space_id`; PNG in PostgreSQL BYTEA.

### Modified Capabilities

- `plants`: (delta in `openspec/changes/plant-qr-generation/specs/plants/spec.md`) — `CreatePlant` orchestrates QR creation; plant read models expose `qrId` + `targetUrl`; `DeletePlant` cascades QR deletion. *Note: canonical plants requirements live in `openspec/changes/plant-context/specs/plants/spec.md` until archived to `openspec/specs/plants/`.*

## Impact

### Bounded contexts

| Context | Impact |
|---------|--------|
| **qr** (new) | Full new context: domain, application, infrastructure, transport |
| **plants** | `qr_id` column, create/delete handlers, DTOs/mappers/view-models |
| **core** | `app.config.ts` (`QR_BASE_URL`), exception filter |
| **app** | `AppModule` imports `QrModule` |

### APIs (new)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/qrs/:id` | QR metadata |
| GET | `/api/qrs/:id/image` | PNG download |
| GET | `/api/qrs/by-plant/:plantId` | Lookup by plant |
| POST | `/api/qrs/:id/regenerate` | New PNG, same URL |

GraphQL: `qrFindById`, `qrFindByPlantId`, `qrRegenerate`.

### Dependencies

- `qrcode` (+ `@types/qrcode` if needed)

### Delivery

| PR | Scope | Est. lines |
|----|-------|------------|
| 1 | `qr` domain + migrations + persistence + unit tests | ~350–450 |
| 2 | `qr` REST + GraphQL transport | ~120–180 |
| 3 | `plants` integration + e2e | ~150–250 |

Chained PRs recommended: **Yes** (400-line budget risk: **High**).

### Rollback plan

1. Revert PR(s) in reverse order (plants integration → transport → core).
2. Run down-migrations: drop `plants.qr_id`, drop `qrs` table.
3. Remove `qrcode` from `package.json` and `QR_BASE_URL` from config if unused elsewhere.
4. No data loss outside `qrs` rows and `plants.qr_id` references.

## Success Criteria

- [ ] Every newly created plant has a linked QR with persisted `targetUrl` matching `{QR_BASE_URL}/plants/{plantId}?spaceId={spaceId}`.
- [ ] `GET /api/qrs/:id/image` returns valid PNG for space members.
- [ ] `POST /api/qrs/:id/regenerate` updates PNG and increments `generation` without changing `id` or `target_url`.
- [ ] Plant REST/GraphQL read responses include `qrId` and `targetUrl` when linked.
- [ ] Deleting a plant removes the associated QR row.
- [ ] Application fails fast at boot when `QR_BASE_URL` is missing.

## Open Questions

1. Confirm exact frontend detail route (default: `/plants/{plantId}?spaceId={spaceId}`).
2. Backfill strategy for pre-existing plants (separate change?).
