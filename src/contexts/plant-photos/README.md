# Plant Photos Context

## Purpose

The `plant-photos` context lets a user upload one or more photos of a specific
plant and keeps a real, persisted history of them — each photo has its own
`plantId` association and its own automatic `createdAt` timestamp. It is the
wiring the `files` context's own README explicitly deferred ("wiring
plants/plant-species to upload here" was out of scope for v1).

This context owns **no byte storage** of its own. Uploading a photo delegates
entirely to the existing `files` bounded context (`IFilesPort` →
`UploadFileCommand`); `plant-photos` only persists the thin association
`{ id, plantId, fileId, url, userId, spaceId, createdAt }`. All data is
tenant-scoped via `SpaceContext`.

## Core aggregate

### `PlantPhotoAggregate`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `PlantPhotoIdValueObject` | UUID generated on upload |
| `plantId` | `UuidValueObject` | The plant this photo belongs to — **not FK-enforced** (same convention as `care-log`'s `plantId`) |
| `fileId` | `UuidValueObject` | The underlying `files` context record |
| `url` | `PlantPhotoUrlValueObject` | Denormalized copy of the file's resolved URL at upload time (files are immutable, so this never drifts) |
| `userId` | `UuidValueObject` | Uploader (`@CurrentUser`) |
| `spaceId` | `UuidValueObject` | Space owning the photo (`SpaceContext` ALS) |
| `createdAt` / `updatedAt` | `Date` | Managed by TypeORM — `createdAt` is the photo's real upload timestamp |

Domain methods: `create()` → `PlantPhotoUploadedEvent`; `delete()` →
`PlantPhotoDeletedEvent`. There is no `update()` — like `FileAggregate`, a
photo association is immutable once created.

## Cross-context integration

Two outbound ports, both living in `plant-photos/application/ports/` with
adapters in `plant-photos/infrastructure/adapters/` that dispatch through the
global `CommandBus`/`QueryBus` — this context never imports `files` or
`plants` domain/application directly (enforced by
`plant-photos-no-cross-context-import.spec.ts`).

### `IFilesPort` → `files`

| Method | Dispatches | Notes |
|--------|-----------|-------|
| `uploadFile(input)` | `UploadFileCommand` | Returns `{ id, url }`. Mime/size validation happens **inside** `files` (`FileMimeTypeValueObject`/`FileSizeValueObject`) — `plant-photos` does not duplicate it. Exceptions (`UnsupportedFileTypeException`, `FileTooLargeException`) propagate and are resolved globally by `BaseExceptionFilter`, regardless of which context's controller initiated the call. |
| `deleteFile(fileId)` | `DeleteFileCommand` | Called when a plant photo is deleted |

### `IPlantsPort` → `plants`

| Method | Dispatches | Notes |
|--------|-----------|-------|
| `getImageUrl(plantId)` | `PlantFindByIdQuery` | Returns `null` on any failure (dangling `plantId`, plant not found, etc.) |
| `updateImageUrl(plantId, imageUrl, requestingUserId)` | `UpdatePlantCommand` | Keeps `plants.imageUrl` mirroring the most recently uploaded photo. **Best-effort from the caller's side** — `UploadPlantPhotoCommandHandler` and `DeletePlantPhotoCommandHandler` both catch and log a warning rather than failing the whole operation |

**Why best-effort:** this codebase never wraps cross-context `CommandBus`
dispatches in a shared DB transaction (see `care-log`'s `CareLogAdapter` for
the same pattern on the read side). Since `plantId` is not FK-validated, a
dangling reference or a `plants` outage must not block an otherwise valid
photo upload — the `PlantPhoto` record itself is the actual source of truth
for history; `plants.imageUrl` is a convenience mirror for UI that hasn't
adopted a gallery view yet.

**Delete resync:** on delete, `SyncPlantImageUrlAfterDeleteService.execute()`
checks whether the deleted photo's `url` matches the plant's current
`imageUrl` (via `getImageUrl`); if so, it queries the next most recent
remaining photo (`plantId` filter, `createdAt` DESC, 1 item) and resyncs
`imageUrl` to it, or to `null` if none remain.

The upload-time sync and the delete-time resync each live in their own
`IBaseService` application service —
`SyncPlantImageUrlAfterUploadService`
(`application/services/write/sync-plant-image-url-after-upload/`), used by
`UploadPlantPhotoCommandHandler`, and `SyncPlantImageUrlAfterDeleteService`
(`application/services/write/sync-plant-image-url-after-delete/`), used by
`DeletePlantPhotoCommandHandler` — instead of being duplicated inline in
each handler.

**Ownership check:** `AssertPlantPhotoOwnershipService`
(`application/services/write/assert-plant-photo-ownership/`) throws
`PlantPhotoForbiddenException` when `requestingUserId` doesn't match the
photo's uploader — same "assert service instead of inline check" convention
as `AssertPlantPhotoExistsService`.

## Commands & Queries

| Type | Name | Notes |
|------|------|-------|
| Command | `UploadPlantPhoto` | Orchestrates `files` upload + persists the association + best-effort `imageUrl` sync. Returns `{ id, plantId, fileId, url, createdAt }` |
| Command | `DeletePlantPhoto` | Uploader-only (403 otherwise); deletes the underlying file too; best-effort `imageUrl` resync |
| Query | `PlantPhotoFindById` | Tenant-scoped `PlantPhotoViewModel` |
| Query | `PlantPhotoFindByCriteria` | Type-safe `Criteria` pattern — paginated, filterable by `plantId`/`fileId`/`userId`/timestamps, default sort `createdAt` DESC |

Events: `PlantPhotoUploaded`, `PlantPhotoDeleted`.

## Transport

### REST (`/api/plant-photos`, guarded by `JwtAuthGuard` + global `SpaceGuard`)

| Method | Path | Action | Success |
|--------|------|--------|---------|
| POST | `/plant-photos` | Upload (multipart `file` part + `plantId` field) | 201 |
| GET | `/plant-photos` | List (filters `plantId`, `page`, `limit`) | 200 |
| GET | `/plant-photos/:id` | Metadata | 200 |
| DELETE | `/plant-photos/:id` | Delete (uploader only) | 200 |

Upload uses Multer (`FileInterceptor`, in-memory, local hard size ceiling for
buffering only — business mime/size limits are enforced inside `files`).

### GraphQL (code-first, `JwtAuthGuard` + global `SpaceGuard`)

- Queries: `plantPhotoFindById(input)`, `plantPhotosFindByCriteria(input)`
- Mutation: `plantPhotoDelete(input)` → `MutationResponseDto`

Binary upload is **not** exposed over GraphQL — same convention as `files`;
use the REST endpoint.

### MCP tools (`transport/mcp/`)

`plant_photo_find_by_id`, `plant_photo_find_by_criteria`,
`plant_photo_delete`. Binary upload is not exposed as a tool (same reasoning
as `files`).

## Persistence

- `plant_photos` — `id`, `plant_id`, `file_id`, `url`, `user_id`, `space_id`,
  `created_at`, `updated_at`.
- `file_id` **is** FK-enforced (`FK_plant_photos_file_id`, `ON DELETE
  CASCADE`) — unlike `plant_id`. Deleting a `files` row directly (any path,
  not just `DeletePlantPhotoCommand`) removes its dependent `plant_photos` row
  too, so an association can never outlive the bytes it points to.
- Indexes: `IDX_plant_photos_space_id` (space_id),
  `IDX_plant_photos_plant_id_space_id` (plant_id, space_id),
  `IDX_plant_photos_plant_id_space_id_created_at` (plant_id, space_id,
  created_at DESC) — supports the default `findByCriteria` sort.
- Wrapped with `createTenantRepository`, so a photo is invisible outside its
  space.
- Migration: `1780000000023-CreatePlantPhotos`.

## Domain exceptions → HTTP status

Mapped in `transport/exceptions/plant-photos-exception.filter.ts`:

| Exception | HTTP |
|-----------|------|
| `PlantPhotoNotFoundException` | 404 Not Found |
| `PlantPhotoForbiddenException` | 403 Forbidden |

## Tests

- Unit (`src/contexts/plant-photos/**/*.spec.ts`): value objects, aggregate,
  builder, command/query handlers (mocking the ports), the two adapters
  (mocking `CommandBus`/`QueryBus`), TypeORM mapper, REST controller, GraphQL
  filterable-fields registry, and the cross-context-import guard.
- Integration (`test/integration/plant-photos/`): tenant isolation,
  `findByCriteria` ordering/pagination.
- E2E (`test/e2e/plant-photos/`): REST upload/list/delete + validation
  (propagated from `files`) + tenant isolation; GraphQL query + delete
  mutation.

## Out of scope (this change)

Photo captions, ordering/reordering, cover-photo selection independent of
recency, photo editing/filters/annotation, automatic photo analysis, and any
gallery/timeline UI (a future story under the "Plant Photo History" epic).
