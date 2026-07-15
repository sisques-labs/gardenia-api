# Design: PlantPhotos bounded context

## Technical Approach

Mirror the `care-log` module structure (domain → application → infrastructure → transport, CQRS, dual transport, tenant isolation via `createTenantRepository`). `PlantPhotoAggregate` is immutable like `FileAggregate` (create + delete only, no update) since a photo association never changes shape once uploaded.

The upload flow is an orchestration, not new storage: `UploadPlantPhotoCommandHandler` calls the existing `files` context (via `IFilesPort` → `UploadFileCommand`) to persist bytes + get back `{ id, url }`, then persists its own thin association row, then best-effort syncs `plants.imageUrl` (via `IPlantsPort` → `UpdatePlantCommand`).

Both cross-context calls follow the repo's established adapter-via-Bus pattern: the port interface lives in `plant-photos/application/ports/`, the adapter in `plant-photos/infrastructure/adapters/`, dispatching through the global `CommandBus`. Neither adapter imports another context's domain/application directly.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|------------------------|-----------|
| New aggregate vs. reuse `plants.imageUrl` | New `PlantPhotoAggregate` + `plant_photos` table | Overwrite `plants.imageUrl` on every upload, no history | GDN-37's AC explicitly require "one or more photos" each "timestamped automatically" — a single mutable field cannot represent history. Confirmed with product owner. |
| `plantId` validation | Plain field, not FK-checked against `plants` | Cross-context `assertPlantExists` before every upload | Matches this repo's own established, documented convention (`care-log`'s README states plantId is "not FK-enforced at DB level"); keeps `plant-photos` simple and consistent |
| Byte storage | 100% delegated to `files` via `IFilesPort` | Duplicate an `IFileStoragePort`-style adapter inside `plant-photos` | Jira explicitly scopes out "building new file storage/upload infrastructure"; `files` already owns validation (mime/size) at the domain level (`FileMimeTypeValueObject`, `FileSizeValueObject`) so no duplicate validation pipe is needed in `plant-photos`' transport — exceptions thrown deep inside `files` during the `UploadFileCommand` dispatch propagate normally and are already resolved globally by `BaseExceptionFilter` (see `resolveFilesExceptionStatus`) regardless of which context's controller initiated the call |
| `plants.imageUrl` sync | Best-effort, non-fatal (`.catch()` + warn log), mirrors `CareLogAdapter`'s own "errors are silently caught... to avoid breaking [caller] if [dependency] is unavailable" convention | Wrap in a single DB transaction across contexts | This codebase never does cross-context DB transactions (CommandBus dispatch is a same-process call, not a saga); making it fatal would mean a `plants` outage blocks all photo uploads, and a deleted plant (edge case, since `plantId` isn't FK-checked) would incorrectly fail the whole upload despite the photo itself being valid |
| Delete — resync `imageUrl` | On `DeletePlantPhotoCommand`, if the deleted photo's `url` matches the plant's current `imageUrl`, re-run the same `IPlantsPort.updateImageUrl` with the next most-recent remaining photo's url (or `null` if none) | Leave `imageUrl` stale after deleting the current photo | Avoids a dead image link on the plant card/detail view — the whole point of mirroring is that it stays in sync |
| GraphQL upload | Not exposed (REST-only) | Support `Upload` scalar over GraphQL | Matches `files`' own explicit convention ("Binary upload is not exposed over GraphQL — use the REST endpoint") |
| REST route shape | `POST /api/plant-photos` (multipart, `plantId` field + `file` part) + `GET /api/plant-photos/plant/:plantId` (paginated) | Nest under `/api/plants/:plantId/photos` | Mirrors `care-log`'s existing `/api/care-log` + `/api/care-log/plant/:plantId` idiom exactly — this repo's established shape for "root resource, plant-scoped list sub-route"; avoids touching the `plants` controller |
| Migration number | `1780000000023-CreatePlantPhotos` | — | Next free slot after `...0022` |
| Multer hard ceiling | Same `FILE_UPLOAD_HARD_LIMIT_BYTES` constant duplicated locally in `PlantPhotosController` (transport-level memory guard only, independent of business validation which lives in `files`) | Extract a shared constant now | Two call sites doesn't justify a shared module yet; business limits (the ones that matter) are still single-sourced in `files` config |

## Data Flow

```
POST /api/plant-photos (multipart: file, plantId)
  │ (JwtAuthGuard + SpaceGuard, ALS SpaceContext set for the request)
  ▼
UploadPlantPhotoCommand ──CommandBus──> UploadPlantPhotoCommandHandler
  │
  ├─1─> IFilesPort.uploadFile({filename, mimeType, size, content, userId, spaceId})
  │        └─> FilesAdapter ──CommandBus──> UploadFileCommand ──> files context
  │              (FileMimeTypeValueObject / FileSizeValueObject validate; may throw
  │               UnsupportedFileTypeException / FileTooLargeException — resolved
  │               globally by BaseExceptionFilter, HTTP 400, regardless of caller)
  │        <── { id: fileId, url }
  │
  ├─2─> build PlantPhotoAggregate, photo.create() → PlantPhotoUploadedEvent
  │        └─> PlantPhotoWriteRepository.save() (tenant-scoped)
  │
  └─3─> IPlantsPort.updateImageUrl(plantId, url)   [best-effort]
           └─> PlantsAdapter ──CommandBus──> UpdatePlantCommand ──> plants context
                 (catches + logs a warning on failure; does not fail the upload)

Response: 201 { id, plantId, fileId, url, createdAt }

GET /api/plant-photos/plant/:plantId?page&limit
  ──QueryBus──> PlantPhotoFindByPlantQuery ──> PlantPhotoReadRepository.findByPlant()
  (tenant-scoped, ORDER BY created_at DESC) ──> PaginatedResult<PlantPhotoViewModel>

DELETE /api/plant-photos/:id  (author only)
  ──CommandBus──> DeletePlantPhotoCommand ──> AssertPlantPhotoExistsService
  │  (403 if requestingUserId !== photo.userId)
  ├─1─> IFilesPort.deleteFile(fileId)
  ├─2─> photo.delete() → PlantPhotoDeletedEvent; writeRepository.delete(id)
  └─3─> if photo.url === current plants.imageUrl:
           PlantPhotoFindByPlantQuery (limit 1, excluding the deleted id)
           IPlantsPort.updateImageUrl(plantId, nextPhoto?.url ?? null)   [best-effort]
```

## File Changes

All new files under `src/contexts/plant-photos/`. Tree (~55 files, mirroring `care-log`'s shape):

```
domain/
  aggregates/plant-photo.aggregate.ts (+ .spec.ts)
  builders/plant-photo.builder.ts (+ .spec.ts)
  events/interfaces/plant-photo-event-data.interface.ts
  events/plant-photo-uploaded/plant-photo-uploaded.event.ts
  events/plant-photo-deleted/plant-photo-deleted.event.ts
  exceptions/plant-photo-not-found.exception.ts       # 404
  exceptions/plant-photo-forbidden.exception.ts        # 403
  interfaces/plant-photo.interface.ts
  primitives/plant-photo.primitives.ts
  repositories/read/plant-photo-read.repository.ts
  repositories/write/plant-photo-write.repository.ts
  value-objects/plant-photo-id/plant-photo-id.value-object.ts (+ .spec.ts)
  view-models/plant-photo.view-model.ts
application/
  ports/files.port.ts
  ports/plants.port.ts
  commands/upload-plant-photo/upload-plant-photo.command.ts + .handler.ts (+ .spec.ts) + .result.ts
  commands/delete-plant-photo/delete-plant-photo.command.ts + .handler.ts (+ .spec.ts)
  queries/plant-photo-find-by-plant/plant-photo-find-by-plant.query.ts + .handler.ts (+ .spec.ts)
  queries/plant-photo-find-by-id/plant-photo-find-by-id.query.ts + .handler.ts (+ .spec.ts)
  services/write/assert-plant-photo-exists/assert-plant-photo-exists.service.ts (+ .spec.ts)
infrastructure/
  adapters/files.adapter.ts (+ .spec.ts)
  adapters/plants.adapter.ts (+ .spec.ts)
  persistence/typeorm/entities/plant-photo.entity.ts
  persistence/typeorm/mappers/plant-photo-typeorm.mapper.ts (+ .spec.ts)
  persistence/typeorm/repositories/plant-photo-typeorm-read.repository.ts
  persistence/typeorm/repositories/plant-photo-typeorm-write.repository.ts
transport/
  exceptions/plant-photos-exception.filter.ts
  rest/controllers/plant-photos.controller.ts (+ .spec.ts)
  rest/dtos/upload-plant-photo-response.dto.ts
  rest/dtos/plant-photo-rest-response.dto.ts
  rest/mappers/plant-photo/plant-photo.mapper.ts (+ .spec.ts)
  graphql/dtos/responses/plant-photo.response.dto.ts
  graphql/mappers/plant-photo/plant-photo.mapper.ts (+ .spec.ts)
  graphql/resolvers/plant-photo/queries/plant-photo-queries.resolver.ts (+ .spec.ts)
  graphql/resolvers/plant-photo/mutations/plant-photo-mutations.resolver.ts (+ .spec.ts)
  mcp/schemas/plant-photo-find-by-plant.schema.ts
  mcp/schemas/plant-photo-find-by-id.schema.ts
  mcp/schemas/plant-photo-delete.schema.ts
  mcp/tools/plant-photo-find-by-plant.tool.ts
  mcp/tools/plant-photo-find-by-id.tool.ts
  mcp/tools/plant-photo-delete.tool.ts
plant-photos.module.ts
plant-photos-no-cross-context-import.spec.ts
README.md
```

Plus:
- `src/database/migrations/1780000000023-CreatePlantPhotos.ts`
- `src/app.module.ts` — register `PlantPhotosModule`
- `test/integration/plant-photos/*.integration-spec.ts`
- `test/e2e/plant-photos/*.e2e-spec.ts`

## Database

### `plant_photos`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `plant_id` | `uuid` | Not FK-enforced (matches `care-log` convention) |
| `file_id` | `uuid` | Not FK-enforced — `files` is a separate bounded context |
| `url` | `character varying(1024)` | Denormalized from `files.url` at upload time (files are immutable, so this never drifts) |
| `user_id` | `uuid` | Uploader |
| `space_id` | `uuid` | Tenant column |
| `created_at` / `updated_at` | `TIMESTAMPTZ` | `created_at` is the photo's real, persisted timestamp — satisfies AC2 |

Indexes: `IDX_plant_photos_space_id` (space_id), `IDX_plant_photos_plant_id_space_id` (plant_id, space_id), `IDX_plant_photos_plant_id_space_id_created_at` (plant_id, space_id, created_at DESC) — mirrors `care-log`'s indexing for its `findByPlant`/DESC-order query.
