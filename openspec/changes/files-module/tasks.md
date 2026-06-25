# Tasks: Files Module (`files-module`)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1 400 – 1 800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → Domain + Application (incl. storage port) · PR 2 → Infrastructure (DB adapter + migration) · PR 3 → Transport (REST/GraphQL/MCP) + wiring · PR 4 → Tests |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + Application (incl. `FileStoragePort`) | PR 1 | Aggregate, VOs, enum, events, exceptions, port, commands, queries, assert services |
| 2 | Infrastructure | PR 2 | TypeORM entities (files + file_contents), mapper, tenant repos, `DatabaseFileStorageAdapter`, config, migration |
| 3 | Transport + module wiring | PR 3 | REST (Multer upload + content serving), GraphQL, MCP tools, `FilesModule`, app.module.ts, README |
| 4 | Tests (unit + integration + e2e + static) | PR 4 | All test files |

---

## Phase 1: Domain

- [x] 1.1 Create `src/contexts/files/domain/enums/file-mime-type.enum.ts` — `FileMimeTypeEnum` (`IMAGE_JPEG='image/jpeg'`, `IMAGE_PNG='image/png'`, `IMAGE_WEBP='image/webp'`)
- [x] 1.2 Create `src/contexts/files/domain/value-objects/file-id/file-id.value-object.ts` — extends `UuidValueObject`
- [x] 1.3 Create `src/contexts/files/domain/value-objects/file-name/file-name.value-object.ts` — extends `StringValueObject`; trims; rejects empty; max 255 chars
- [x] 1.4 Create `src/contexts/files/domain/value-objects/file-mime-type/file-mime-type.value-object.ts` — extends `EnumValueObject<typeof FileMimeTypeEnum>`; validates in constructor (image-only allowlist)
- [x] 1.5 Create `src/contexts/files/domain/value-objects/file-size/file-size.value-object.ts` — extends `NumberValueObject`; rejects `<= 0`; max enforced by config-driven guard (handler/pipe also enforce)
- [x] 1.6 Create `src/contexts/files/domain/value-objects/file-storage-key/file-storage-key.value-object.ts` — extends `StringValueObject`; non-empty; max 512
- [x] 1.7 Create `src/contexts/files/domain/value-objects/file-url/file-url.value-object.ts` — extends `StringValueObject`; non-empty; max 1024
- [x] 1.8 Create `src/contexts/files/domain/events/interfaces/file-event-data.interface.ts`
- [x] 1.9 Create `src/contexts/files/domain/events/file-uploaded/file-uploaded.event.ts`
- [x] 1.10 Create `src/contexts/files/domain/events/file-deleted/file-deleted.event.ts`
- [x] 1.11 Create `src/contexts/files/domain/exceptions/file-not-found.exception.ts` — HTTP 404
- [x] 1.12 Create `src/contexts/files/domain/exceptions/unsupported-file-type.exception.ts` — HTTP 400
- [x] 1.13 Create `src/contexts/files/domain/exceptions/file-too-large.exception.ts` — HTTP 400
- [x] 1.14 Create `src/contexts/files/domain/interfaces/file.interface.ts` — `IFile` with VO-typed fields
- [x] 1.15 Create `src/contexts/files/domain/primitives/file.primitives.ts` — `IFilePrimitives extends BasePrimitives` (all primitive types)
- [x] 1.16 Create `src/contexts/files/domain/view-models/file.view-model.ts` — `FileViewModel extends BaseViewModel` (metadata only; no bytes)
- [x] 1.17 Create `src/contexts/files/domain/repositories/write/file-write.repository.ts` — `IFileWriteRepository` + `FILE_WRITE_REPOSITORY` token
- [x] 1.18 Create `src/contexts/files/domain/repositories/read/file-read.repository.ts` — `IFileReadRepository` + `FILE_READ_REPOSITORY` token; `FileCriteria` (`mimeType?`, `filename?`, `page?`, `limit?`)
- [x] 1.19 Create `src/contexts/files/domain/aggregates/file.aggregate.ts` — `create()` emits `FileUploaded`; `delete()` emits `FileDeleted`; NO `update()`; never carries bytes
- [x] 1.20 Create `src/contexts/files/domain/builders/file.builder.ts` — extends `BaseBuilder`; receives `IFilePrimitives`; wraps each field in its VO

---

## Phase 2: Application

- [x] 2.1 Create `src/contexts/files/application/ports/save-file-content.input.ts` — `SaveFileContentInput` (`key`, `bytes: Buffer`, `mimeType`, `spaceId`)
- [x] 2.2 Create `src/contexts/files/application/ports/file-storage.port.ts` — `IFileStoragePort` (`save`/`read`/`delete`/`resolveUrl`) + `FILE_STORAGE_PORT` Symbol; NO TypeORM/vendor types in signature
- [x] 2.3 Create `src/contexts/files/application/services/write/assert-file-exists/assert-file-exists.service.ts` — loads from write repo; throws `FileNotFoundException` when null
- [x] 2.4 Create `src/contexts/files/application/services/read/assert-file-view-model-exists/assert-file-view-model-exists.service.ts` — loads from read repo; throws `FileNotFoundException` when null
- [x] 2.5 Create `src/contexts/files/application/commands/upload-file/upload-file.command.ts` — `UploadFileCommandInput` (filename, mimeType, size, content: Buffer, userId, spaceId); metadata fields → VOs; `content` stays a `Buffer` (documented exception)
- [x] 2.6 Create `src/contexts/files/application/commands/upload-file/upload-file.handler.ts` — builds aggregate (generates id + storageKey); saves metadata via write repo; calls `FileStoragePort.save`; resolves url via `FileStoragePort.resolveUrl`; emits `FileUploaded`; logs entry + completion; returns `{ id, url }`
- [x] 2.7 Create `src/contexts/files/application/commands/delete-file/delete-file.command.ts`
- [x] 2.8 Create `src/contexts/files/application/commands/delete-file/delete-file.handler.ts` — loads aggregate via `AssertFileExistsService`; calls `FileStoragePort.delete(storageKey)`; deletes metadata; emits `FileDeleted`; logs
- [x] 2.9 Create `src/contexts/files/application/queries/file-find-by-id/file-find-by-id.query.ts`
- [x] 2.10 Create `src/contexts/files/application/queries/file-find-by-id/file-find-by-id.handler.ts` — uses `AssertFileViewModelExistsService`; returns `FileViewModel`; logs at entry
- [x] 2.11 Create `src/contexts/files/application/queries/file-find-content-by-id/file-find-content-by-id.query.ts`
- [x] 2.12 Create `src/contexts/files/application/queries/file-find-content-by-id/file-find-content-by-id.handler.ts` — asserts metadata exists (404), then `FileStoragePort.read(storageKey)`; returns `Buffer`; logs at entry
- [x] 2.13 Create `src/contexts/files/application/queries/file-find-by-criteria/file-find-by-criteria.query.ts` — `mimeType?`, `filename?`, `page`, `limit`
- [x] 2.14 Create `src/contexts/files/application/queries/file-find-by-criteria/file-find-by-criteria.handler.ts` — scoped to `spaceId`; passes criteria to read repo; empty → `[]`; logs at entry

---

## Phase 3: Infrastructure

- [x] 3.1 Create `src/contexts/files/infrastructure/config/files.config.ts` — `FilesConfig`: `maxSizeBytes` (`FILES_MAX_SIZE_BYTES`, default 10485760), `allowedMimeTypes` (`FILES_ALLOWED_MIME_TYPES`, default `image/jpeg,image/png,image/webp`), `publicBaseUrl` (`FILES_PUBLIC_BASE_URL`, optional)
- [x] 3.2 Create `src/contexts/files/infrastructure/persistence/typeorm/entities/file.entity.ts` — `files` table: `id` (uuid pk), `filename` (varchar 255), `mime_type` (varchar 100), `size` (int), `storage_key` (varchar 512), `url` (varchar 1024), `user_id` (uuid), `space_id` (uuid NOT NULL), `created_at`, `updated_at`; `@Index('IDX_files_space_id', ['spaceId'])`
- [x] 3.3 Create `src/contexts/files/infrastructure/persistence/typeorm/entities/file-content.entity.ts` — `file_contents` table: `file_id` (uuid pk, FK→files.id ON DELETE CASCADE), `space_id` (uuid NOT NULL), `data` (`bytea`/`Buffer`); `@Index('IDX_file_contents_space_id', ['spaceId'])`
- [x] 3.4 Create `src/contexts/files/infrastructure/persistence/typeorm/mappers/file-typeorm.mapper.ts` — `toDomain(entity): IFilePrimitives` + `toPersistence(aggregate): FileEntity` (metadata only)
- [x] 3.5 Create `src/contexts/files/infrastructure/persistence/typeorm/repositories/file-typeorm-write.repository.ts` — extends `BaseDatabaseRepository`; `createTenantRepository` in constructor; implements `IFileWriteRepository`
- [x] 3.6 Create `src/contexts/files/infrastructure/persistence/typeorm/repositories/file-typeorm-read.repository.ts` — extends `BaseDatabaseRepository`; `createTenantRepository`; implements `IFileReadRepository`; `findByCriteria` builds query with `mime_type` exact, `filename` ILIKE; pagination default page=1, limit=20, max=100
- [x] 3.7 Create `src/contexts/files/infrastructure/adapters/database-file-storage.adapter.ts` — `@Injectable()` implementing `IFileStoragePort`; injects a tenant-scoped `FileContentEntity` repo; `save` upserts `{ file_id, space_id, data }`; `read` returns `data` Buffer or null; `delete` removes the row; `resolveUrl(key)` returns `` `${config.publicBaseUrl ?? ''}/api/files/${key}/content` ``; logs start/completion of I/O
- [x] 3.8 Create `src/database/migrations/1780000000019-CreateFiles.ts` — `up()` creates `files` (+ `IDX_files_space_id`) then `file_contents` (FK→files ON DELETE CASCADE, `IDX_file_contents_space_id`); `down()` drops `file_contents` then `files`

---

## Phase 4: Transport

- [x] 4.1 Create `src/contexts/files/transport/rest/dtos/file-criteria.dto.ts` — optional `mimeType`, `filename`, `page`, `limit`
- [x] 4.2 Create `src/contexts/files/transport/rest/dtos/file-rest-response.dto.ts` — all `FileViewModel` fields (incl. `url`)
- [x] 4.3 Create `src/contexts/files/transport/rest/dtos/upload-file-response.dto.ts` — `{ id, url }`
- [x] 4.4 Create `src/contexts/files/transport/rest/mappers/file/file.mapper.ts` — `FileViewModel → FileRestResponseDto`
- [x] 4.5 Create `src/contexts/files/transport/rest/pipes/image-file-validation.pipe.ts` — `ParseFilePipe`-based; rejects MIME outside the allowlist and size over the configured max (400)
- [x] 4.6 Create `src/contexts/files/transport/rest/controllers/files.controller.ts` — routes: `POST /files` (201, `@UseInterceptors(FileInterceptor('file', { limits, fileFilter }))` + validation pipe → `UploadFile`), `GET /files` (200), `GET /files/:id` (200), `GET /files/:id/content` (200, sets `Content-Type`, streams bytes), `DELETE /files/:id` (200); guards `JwtAuthGuard` + `SpaceGuard`; `@CurrentUser` → userId; log at each entry point
- [x] 4.7 Create `src/contexts/files/transport/graphql/enums/file-registered-enums.graphql.ts` — `registerEnumType(FileMimeTypeEnum, { name: 'FileMimeType' })`
- [x] 4.8 Create `src/contexts/files/transport/graphql/dtos/requests/file-criteria-graphql.dto.ts` — `@InputType()` with `mimeType?`, `filename?`, `page?`, `limit?`
- [x] 4.9 Create `src/contexts/files/transport/graphql/dtos/responses/file.response.dto.ts` — `@ObjectType()` with all `FileViewModel` fields; `mimeType` typed as registered enum
- [x] 4.10 Create `src/contexts/files/transport/graphql/mappers/file.mapper.ts` — `FileViewModel → FileResponseDto`
- [x] 4.11 Create `src/contexts/files/transport/graphql/resolvers/file-queries.resolver.ts` — `file(id: ID!)`, `files(criteria)`; guards; `QueryBus` only; log at entry
- [x] 4.12 Create `src/contexts/files/transport/graphql/resolvers/file-mutations.resolver.ts` — `deleteFile(id: ID!)`; guards; `CommandBus` only; log at entry (NO GraphQL upload)
- [x] 4.13 Create `src/contexts/files/transport/mcp/schemas/file-find-by-id.schema.ts`, `file-list.schema.ts`, `file-delete.schema.ts` — Zod input schemas
- [x] 4.14 Create `src/contexts/files/transport/mcp/tools/file-find-by-id.mcp-tool.ts`, `file-list.mcp-tool.ts`, `file-delete.mcp-tool.ts` — `{Name}McpTool implements IMcpTool`, `@McpTool()` + `@Injectable()`; read user/space from `IMcpToolContext`; dispatch via Command/QueryBus; wire names `file_find_by_id`, `file_list`, `file_delete` (NO upload tool)

---

## Phase 5: Module Wiring & Docs

- [x] 5.1 Create `src/contexts/files/files.module.ts` — providers grouped as `COMMAND_HANDLERS`, `QUERY_HANDLERS`, `APPLICATION_SERVICES`, `DOMAIN_BUILDERS`, `INFRASTRUCTURE_REPOSITORIES`, `INFRASTRUCTURE_MAPPERS`, `INFRASTRUCTURE_ENTITIES`, `TRANSPORT_PROVIDERS`, `MCP_TOOLS`; bind `FILE_WRITE_REPOSITORY`/`FILE_READ_REPOSITORY`/`FILE_STORAGE_PORT` via `useClass`; `TypeOrmModule.forFeature([FileEntity, FileContentEntity])`; register `FilesConfig`; import `CqrsModule`
- [x] 5.2 Modify `src/app.module.ts` — add `FilesModule` to `imports[]`
- [x] 5.3 Create `src/contexts/files/README.md` — context walkthrough (commands, queries, events, endpoints, enum, storage port/adapter seam, MCP tools), following the auth context README template

---

## Phase 6: Tests

- [x] 6.1 Unit — `file-mime-type.value-object.spec.ts`: `image/jpeg|png|webp` accepted; `application/pdf`, `image/gif`, junk throw
- [x] 6.2 Unit — `file-size.value-object.spec.ts`: positive in-range accepted; `0`, negative throw
- [x] 6.3 Unit — `file-name.value-object.spec.ts`: non-empty trimmed accepted; empty/whitespace throws; > 255 throws
- [x] 6.4 Unit — `file.aggregate.spec.ts`: `create()` emits `FileUploaded`; `delete()` emits `FileDeleted`; no update path
- [x] 6.5 Unit — `upload-file.handler.spec.ts`: saves metadata, calls `FileStoragePort.save`, resolves url, returns `{id,url}`; non-image input → throws
- [x] 6.6 Unit — `delete-file.handler.spec.ts`: calls `FileStoragePort.delete` + repo delete; id not found → 404
- [x] 6.7 Unit — `file-find-by-id.handler.spec.ts`: found → ViewModel; not found → 404
- [x] 6.8 Unit — `file-find-content-by-id.handler.spec.ts`: found → Buffer via port; not found → 404
- [x] 6.9 Unit — `file-find-by-criteria.handler.spec.ts`: delegates criteria to read repo; empty → `[]`
- [x] 6.10 Unit — `database-file-storage.adapter.spec.ts`: `save`/`read`/`delete` over a mocked content repo; `resolveUrl` returns `/api/files/:id/content` (with/without public base url)
- [x] 6.11 Integration — `file-typeorm-write/read.repository.integration-spec.ts`: metadata tenant isolation (S1 invisible under S2); `filename` ILIKE; `mimeType` exact filter
- [x] 6.12 Integration — `database-file-storage.adapter.integration-spec.ts`: `bytea` round-trip (bytes out == bytes in); content tenant isolation; `ON DELETE CASCADE` removes content when metadata deleted
- [x] 6.13 E2E — `files-rest.e2e-spec.ts`: `POST /files` multipart PNG → 201 `{id,url}`; `GET /files/:id/content` → same bytes + `Content-Type: image/png`; `text/plain` → 400; oversize → 400/413; `GET /files` list + filters; `DELETE /files/:id` → 200 then content 404; cross-tenant download → 404; guards enforced
- [x] 6.14 E2E — `files-graphql.e2e-spec.ts`: `file(id)`, `files(criteria)`, `deleteFile(id)`; guards enforced
- [x] 6.15 Static — `files-no-cross-context-import.spec.ts`: scan `src/contexts/files/**` — assert no import from any other `@contexts/<other>/` bounded context
