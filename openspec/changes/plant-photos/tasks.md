# Tasks: PlantPhotos bounded context

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1 800 – 2 200 |
| 400-line budget risk | High (single-repo dev branch, not chained PRs per current workflow) |
| Delivery strategy | Single feature branch, multiple commits by phase |

## Phase 1: Domain

- [ ] 1.1 `domain/value-objects/plant-photo-id/plant-photo-id.value-object.ts` (+ spec) — extends `UuidValueObject`
- [ ] 1.2 `domain/events/interfaces/plant-photo-event-data.interface.ts` — `IPlantPhotoEventData { id, plantId, fileId, url, userId, spaceId }`
- [ ] 1.3 `domain/events/plant-photo-uploaded/plant-photo-uploaded.event.ts`
- [ ] 1.4 `domain/events/plant-photo-deleted/plant-photo-deleted.event.ts`
- [ ] 1.5 `domain/exceptions/plant-photo-not-found.exception.ts` — 404
- [ ] 1.6 `domain/exceptions/plant-photo-forbidden.exception.ts` — 403
- [ ] 1.7 `domain/interfaces/plant-photo.interface.ts` — `IPlantPhoto`, all fields as value objects
- [ ] 1.8 `domain/primitives/plant-photo.primitives.ts` — `IPlantPhotoPrimitives extends BasePrimitives`
- [ ] 1.9 `domain/view-models/plant-photo.view-model.ts` — `PlantPhotoViewModel extends BaseViewModel`
- [ ] 1.10 `domain/repositories/write/plant-photo-write.repository.ts` — `IPlantPhotoWriteRepository` + `PLANT_PHOTO_WRITE_REPOSITORY` token; `save`, `findById`, `delete`
- [ ] 1.11 `domain/repositories/read/plant-photo-read.repository.ts` — `IPlantPhotoReadRepository` + `PLANT_PHOTO_READ_REPOSITORY` token; `findById`, `findByPlant(plantId, pagination, excludeId?)`
- [ ] 1.12 `domain/aggregates/plant-photo.aggregate.ts` (+ spec) — `create()` → `PlantPhotoUploadedEvent`; `delete()` → `PlantPhotoDeletedEvent`; constructor = hydration only; no `update()` (immutable, like `FileAggregate`)
- [ ] 1.13 `domain/builders/plant-photo.builder.ts` (+ spec) — extends `BaseBuilder`; `withPlantId`, `withFileId`, `withUrl`, `withUserId`, `withSpaceId`; `build()` + `buildViewModel()`

## Phase 2: Application

- [ ] 2.1 `application/ports/files.port.ts` — `IFilesPort` + `FILES_PORT` token: `uploadFile(input): Promise<UploadedFileViewModel>`, `deleteFile(fileId): Promise<void>`
- [ ] 2.2 `application/ports/plants.port.ts` — `IPlantsPort` + `PLANTS_PORT` token: `updateImageUrl(plantId, imageUrl, requestingUserId): Promise<void>` (best-effort — adapter swallows + logs)
- [ ] 2.3 `application/services/write/assert-plant-photo-exists/assert-plant-photo-exists.service.ts` (+ spec)
- [ ] 2.4 `application/commands/upload-plant-photo/upload-plant-photo.command.ts` — input primitives: `plantId, filename, mimeType, size, content(Buffer), userId, spaceId`
- [ ] 2.5 `application/commands/upload-plant-photo/upload-plant-photo.result.ts` — `{ id, plantId, fileId, url, createdAt }`
- [ ] 2.6 `application/commands/upload-plant-photo/upload-plant-photo.handler.ts` (+ spec) — per design.md Data Flow: files upload → build+save aggregate → publish events → best-effort `plants.imageUrl` sync
- [ ] 2.7 `application/commands/delete-plant-photo/delete-plant-photo.command.ts` — `{ id, requestingUserId }`
- [ ] 2.8 `application/commands/delete-plant-photo/delete-plant-photo.handler.ts` (+ spec) — ownership check (403), `files.deleteFile`, `photo.delete()` + `writeRepository.delete()`, conditional `imageUrl` resync (query next most recent, best-effort update)
- [ ] 2.9 `application/queries/plant-photo-find-by-plant/plant-photo-find-by-plant.query.ts` + `.handler.ts` (+ spec) — paginated, DESC `createdAt`
- [ ] 2.10 `application/queries/plant-photo-find-by-id/plant-photo-find-by-id.query.ts` + `.handler.ts` (+ spec)

## Phase 3: Infrastructure

- [ ] 3.1 `infrastructure/adapters/files.adapter.ts` (+ spec) — implements `IFilesPort` via `CommandBus.execute(UploadFileCommand)` / `DeleteFileCommand`
- [ ] 3.2 `infrastructure/adapters/plants.adapter.ts` (+ spec) — implements `IPlantsPort` via `CommandBus.execute(UpdatePlantCommand)`; catches + logs warning on failure, never throws
- [ ] 3.3 `infrastructure/persistence/typeorm/entities/plant-photo.entity.ts` — `plant_photos` table
- [ ] 3.4 `infrastructure/persistence/typeorm/mappers/plant-photo-typeorm.mapper.ts` (+ spec) — `toDomain` / `toPersistence` / `toViewModel`
- [ ] 3.5 `infrastructure/persistence/typeorm/repositories/plant-photo-typeorm-write.repository.ts` — `createTenantRepository`-wrapped
- [ ] 3.6 `infrastructure/persistence/typeorm/repositories/plant-photo-typeorm-read.repository.ts` — `createTenantRepository`-wrapped; `findByPlant` excludes an id when asked (used by the delete resync path)
- [ ] 3.7 `src/database/migrations/1780000000023-CreatePlantPhotos.ts` — table + 3 indexes per design.md

## Phase 4: Transport

- [ ] 4.1 `transport/exceptions/plant-photos-exception.filter.ts` — `resolvePlantPhotosExceptionStatus`; wire into `src/core/filters/base-exception.filter.ts`
- [ ] 4.2 `transport/rest/dtos/upload-plant-photo-response.dto.ts`, `transport/rest/dtos/plant-photo-rest-response.dto.ts`
- [ ] 4.3 `transport/rest/mappers/plant-photo/plant-photo.mapper.ts` (+ spec)
- [ ] 4.4 `transport/rest/controllers/plant-photos.controller.ts` (+ spec) — `POST /plant-photos` (multipart, `FileInterceptor`, local hard-limit constant), `GET /plant-photos/plant/:plantId`, `GET /plant-photos/:id`, `DELETE /plant-photos/:id`
- [ ] 4.5 `transport/graphql/dtos/responses/plant-photo.response.dto.ts`
- [ ] 4.6 `transport/graphql/mappers/plant-photo/plant-photo.mapper.ts` (+ spec)
- [ ] 4.7 `transport/graphql/resolvers/plant-photo/queries/plant-photo-queries.resolver.ts` (+ spec) — `plantPhotosByPlant(plantId, page, limit)`, `plantPhotoFindById(id)`
- [ ] 4.8 `transport/graphql/resolvers/plant-photo/mutations/plant-photo-mutations.resolver.ts` (+ spec) — `plantPhotoDelete(id)` → `MutationResponseDto`
- [ ] 4.9 MCP: `mcp/schemas/*.ts` + `mcp/tools/*.ts` for find-by-plant, find-by-id, delete (no upload tool — matches `files`' own convention)
- [ ] 4.10 `plant-photos.module.ts` — grouped provider arrays per `openspec/config.yaml` convention; register `FILES_PORT`/`PLANTS_PORT` via `useClass`
- [ ] 4.11 Register `PlantPhotosModule` in `src/app.module.ts`
- [ ] 4.12 `plant-photos-no-cross-context-import.spec.ts` — guard test (mirrors `files-no-cross-context-import.spec.ts`)
- [ ] 4.13 `src/contexts/plant-photos/README.md` — full context README (purpose, aggregate, commands/queries, transport tables, cross-context integration, DB, tests) following `care-log`'s README as template

## Phase 5: Tests

- [ ] 5.1 Unit: all `.spec.ts` listed above green
- [ ] 5.2 Integration: `test/integration/plant-photos/` — tenant isolation on read/write repos, `findByPlant` ordering/pagination
- [ ] 5.3 E2E: `test/e2e/plant-photos/` — REST upload (happy path + oversized/wrong-mime → 400 via the `files`-context exception, propagated), list-by-plant, delete (403 for non-author, resync of `plants.imageUrl`), GraphQL query + delete mutation
- [ ] 5.4 `pnpm lint` && `pnpm tsc --noEmit` clean
- [ ] 5.5 `pnpm test:cov` ≥ 80% for the new context

## Phase 6: Docs

- [ ] 6.1 Update this proposal's `openspec/specs/plant-photos/spec.md` on archive (per `openspec/config.yaml` archive rules)
