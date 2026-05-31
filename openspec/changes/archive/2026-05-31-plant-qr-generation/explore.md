# Exploration: plant-qr-generation — gardenia-api

> Discovery phase for QR codes linked to plants. Supersedes the initial MVP idea (derived `qrUrl` without persistence). Grounded in codebase inspection and product decisions from 2026-05-31.

---

## Current State

### `plants` bounded context (complete)

| Layer | Status |
|-------|--------|
| Domain | `PlantAggregate`: `id`, `name`, `species`, `imageUrl`, `userId`, `spaceId`. Events: `PlantCreated`, `PlantUpdated`, `PlantDeleted`. |
| Application | Commands: `CreatePlant`, `UpdatePlant`, `DeletePlant`. Queries: `PlantFindById`, `PlantFindByCriteria`. |
| Infrastructure | TypeORM `plants` table, tenant-scoped read/write repos via `createTenantRepository` + `SpaceContext`. |
| Transport | REST `POST/GET/PATCH/DELETE /api/plants` + GraphQL queries/mutations. |

**Missing for QR:** no `qrId`, no QR module, no `qrcode` dependency, no `QR_BASE_URL` config, no PNG storage.

### Global auth / tenancy

```text
Request
  → OptionalJwtAuthGuard (JWT required for plant routes)
  → SpaceGuard (X-Space-ID + membership)
  → Handler
```

`@SkipSpace()` exists for auth identity and space-list flows only. **No public plant routes today.**

### Repo search

- No existing QR, barcode, share-token, or deep-link patterns.
- No S3 / blob storage module.
- `MONGO_URI` in `.env.example` is unused in `src/`.

---

## Product Decisions (confirmed)

| # | Decision |
|---|----------|
| 1 | User scans QR **inside Gardenia app/web** → lands on **frontend plant detail page**. |
| 2 | Access control stays on frontend + existing API (JWT + space membership). **No anonymous public API** in MVP. |
| 3 | New bounded context **`qr`**: persist **target URL** + **PNG**. Plants link via **`qrId`**. |
| 4 | **Regenerate** supported: same `id` and URL, new PNG, `generation++`. |
| 5 | `QR_BASE_URL` in `.env` (localhost for now; user sets production URL later). |

---

## Scan Flow (target)

```text
┌──────────┐    scan     ┌────────────────────────────────────────────┐
│ QR label │ ──────────► │ {QR_BASE_URL}/plants/{plantId}?spaceId=…  │
└──────────┘             └────────────────────┬───────────────────────┘
                                              │
                                              ▼
                                    Frontend plant detail route
                                    • Require JWT
                                    • Set X-Space-ID from query param
                                    • GET /api/plants/:id → 403/404 if no access
```

---

## Approach Comparison

| # | Approach | Verdict |
|---|----------|---------|
| A | Derived URL only (no DB) | ❌ Superseded — user wants persisted URL + PNG + separate module |
| B | PNG on-the-fly endpoint only | ⚠️ Partial — use as transport for download, not sole storage |
| C | Token in DB + public route | ❌ Deferred — scan is authenticated, not anonymous |
| D | **`qr` bounded context + BYTEA PNG + plant `qr_id`** | ✅ **Selected** |

---

## Relationship Model

```text
plants (1) ────── qr_id ──────► qrs (1)
                ◄── plant_id (UNIQUE)
```

- `qrs.plant_id` UNIQUE NOT NULL — QR owns the logical 1:1 link.
- `plants.qr_id` nullable FK — O(1) enrichment on plant reads.

---

## Cross-Context Integration Options

| Option | Mechanism | Verdict |
|--------|-----------|---------|
| A | Sync `CommandBus` from `CreatePlantCommandHandler` | ✅ Recommended (matches `RegisterAccountCommandHandler` → users/spaces) |
| B | `@EventsHandler(PlantCreatedEvent)` | ❌ No event handlers exist in repo today |

---

## PNG Storage

| Option | Verdict |
|--------|---------|
| PostgreSQL `BYTEA` | ✅ Selected — fits stack, no S3 |
| Filesystem | ❌ No precedent |
| base64 text column | ❌ ~33% overhead |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Plant saved but QR create fails (no single TX) | Document; v2 compensating command |
| Frontend route mismatch | Confirm path before apply (`/plants/{id}?spaceId=`) |
| PR > 400 lines | 3 chained PRs (qr core → transport → plants integration) |
| Legacy plants without QR | Out of MVP scope or separate backfill script |

---

## Files / Modules Touched (forecast)

```
src/contexts/qr/          (new — full bounded context)
src/contexts/plants/        (qr_id, create/delete orchestration, DTOs)
src/core/config/            (QR_BASE_URL)
src/database/migrations/    (CreateQrs, AddQrIdToPlants)
src/app.module.ts
src/core/filters/base-exception.filter.ts
package.json                (qrcode)
test/integration/, test/e2e/
```

---

## Open Questions

1. Exact frontend path — default `{QR_BASE_URL}/plants/{plantId}?spaceId={spaceId}` pending frontend confirmation.
2. Backfill existing plants — separate change or manual script?

---

## Ready for Proposal

**Yes.** Product decisions are sufficient to proceed with `proposal.md`, `design.md`, and `specs/`.
