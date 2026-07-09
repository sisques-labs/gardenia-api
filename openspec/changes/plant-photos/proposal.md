# Proposal: PlantPhotos bounded context

## Why

GDN-37 ("Upload a photo to a plant", child of epic GDN-36 "Plant Photo History"): a Gardenia user wants to upload a photo of a specific plant so they can visually track its evolution over time. Today `PlantAggregate` only carries a single `imageUrl` field, edited as a plain text URL input — there is no upload, no history, and no per-photo timestamp. The `files` bounded context already implements generic image upload/storage (`UploadFileCommand`, `IFileStoragePort`) but its own README explicitly scopes out "wiring plants/plant-species to upload here" as v1 — this change is that wiring.

## What Changes

- New tenant-scoped **`plant-photos`** bounded context with a `PlantPhotoAggregate` — an immutable record `{ id, plantId, fileId, url, userId, spaceId, createdAt, updatedAt }`. Multiple photos per plant are supported; each has its own real, persisted timestamp (`createdAt`) — this is the actual "history", not the single `imageUrl` field.
- Commands: `UploadPlantPhoto` (multipart upload — orchestrates the existing `files` context to store bytes, then persists the association), `DeletePlantPhoto` (author-only).
- Queries: `PlantPhotoFindByPlant` (paginated, DESC by `createdAt`), `PlantPhotoFindById`.
- Dual transport: REST (`/api/plant-photos`, multipart upload) + GraphQL (read query + delete mutation only — binary upload is REST-only, matching the `files` context's own convention). MCP tools for read/delete (no upload tool, same reasoning).
- Cross-context, via the established port-in-application/adapter-in-infrastructure + Command/QueryBus pattern (see `care-log`'s integration into `plants`):
  - `plant-photos` → `files`: `IFilesPort` (`uploadFile`, `deleteFile`) dispatches `UploadFileCommand`/`DeleteFileCommand`. No new byte-storage code — 100% reuse.
  - `plant-photos` → `plants`: `IPlantsPort` (`updateImageUrl`) dispatches `UpdatePlantCommand` so `plants.imageUrl` always mirrors the most recently uploaded (or, after a delete, the next most recent remaining) photo. This call is best-effort (logged, not fatal) — the photo record itself is the source of truth for history; `imageUrl` is a convenience mirror for existing UI that hasn't adopted the gallery yet.
- `plantId` is a plain field on `PlantPhotoAggregate`, not FK-validated against the `plants` context at the DB level — this repo's established convention for child-of-plant aggregates (see `care-log`'s README, which states this explicitly).

**Deferred to future changes (rest of the GDN-36 epic):**
- Gallery / "photo history" viewer UI (this change ships the API only for gallery; GDN-37's own web change wires a minimal "current photo" experience plus the ability to list history, but a dedicated timeline/gallery screen is a future story).
- Photo captions, ordering/reordering, cover-photo selection independent of recency.
- Photo editing, filters, or annotation (explicitly out of scope per the Jira ticket).
- Automatic photo analysis / health detection (explicitly out of scope, potential future story).

**Out of scope:**
- Any change to the `files` context's storage backend (the in-flight S3 adapter on PR #319 is unrelated and not depended upon).
- New byte-storage or validation logic — mime/size limits continue to be enforced exactly once, inside `files`.

## Capabilities

### New Capabilities

- `plant-photos`: tenant-scoped upload + list + delete of photos associated with a plant, dual transport (REST + GraphQL), MCP read/delete tools.

### Modified Capabilities

- `plants`: no domain change to `PlantAggregate` itself (the `imageUrl` field already exists); gains a new inbound cross-context caller (`plant-photos` → `IPlantsPort` → `UpdatePlantCommand`). No new port is added to `plants` itself — the port lives in `plant-photos` per the established pattern.
- `files`: no change. Consumed as-is via `IFilesPort` → `UploadFileCommand`/`DeleteFileCommand`.

## Impact

| Area | Impact |
|------|--------|
| `src/contexts/plant-photos/` | New — full bounded context (~55 files) |
| `src/contexts/plants/` | No file changes — only receives `UpdatePlantCommand` dispatches from a new caller |
| `src/database/migrations/` | New migration `1780000000023-CreatePlantPhotos.ts` |
| `src/app.module.ts` (or wherever contexts are registered) | Register `PlantPhotosModule` |
| Web (gardenia-web) | Separate change — add-photo UI, out of scope here |

## Rollback Plan

Purely additive: a new table + a new module. Rollback = revert the migration (`down()` drops `plant_photos`) and unregister `PlantPhotosModule`. No existing table, column, or public API is altered. The only side effect on `plants` is that `imageUrl` may have been overwritten by an upload — reverting the migration does not undo that (acceptable: `imageUrl` writes go through the existing `UpdatePlantCommand`, same as manual edits already do).
