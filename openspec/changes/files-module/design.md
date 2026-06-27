# Design: Files Module (`files`)

## Technical Approach

Mirror the standard tenant-scoped bounded-context shape (domain → application →
infrastructure → transport, CQRS, tenant isolation via
`createTenantRepository`), with one defining twist: a **storage port/adapter
seam** for the raw bytes.

The `FileAggregate` is a thin metadata record — `filename`, `mimeType` (enum,
image-only), `size`, `storageKey`, `url`, `userId`, `spaceId` — built via a
`FileBuilder`, persisted through the usual read/write repositories. It **never
holds the byte buffer**. The bytes live behind `IFileStoragePort`, whose only v1
implementation, `DatabaseFileStorageAdapter`, writes them to a dedicated
`file_contents` (`bytea`) table keyed by `file_id` and resolves the public URL to
the download endpoint.

This split is the whole point: every layer except the adapter is ignorant of
*where* bytes live. The day we move to S3, we write `S3FileStorageAdapter`
implementing the same port and swap the `useClass` binding — domain, handlers,
controllers, resolvers, and the metadata schema are untouched.

Files are **immutable**: there is `UploadFile` and `DeleteFile`, no
`UpdateFile`. Re-photographing means upload-new + delete-old.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|-----------------------|-----------|
| Storage abstraction | `IFileStoragePort` (`save`/`read`/`delete`/`resolveUrl`) + `useClass` adapter | Inline TypeORM `bytea` access in handlers | The user's explicit ask: DB now, swappable later. Port keeps every other layer backend-agnostic |
| v1 backend | `DatabaseFileStorageAdapter` → Postgres `bytea` | Filesystem; S3 now | "A priori lo guardamos en base de datos." S3 deferred but designed-for |
| Bytes vs. metadata storage | Separate `file_contents` table; metadata in `files` | Single table with a `bytea` column on `files` | Keeps metadata queries cheap (never `SELECT` blobs) and makes the S3 migration a clean "stop writing `file_contents`" |
| URL ownership | Adapter resolves the URL (`resolveUrl`) | Domain builds the URL | URL is an opaque locator; DB adapter → `/api/files/:id/content`, S3 adapter → object/signed URL, with no domain change |
| `mimeType` modeling | `FileMimeTypeEnum` (`IMAGE_JPEG`/`IMAGE_PNG`/`IMAGE_WEBP`) via `EnumValueObject` | Free-text `StringValueObject` | "Solo imágenes": the allowlist is enforced at the domain level, not just at transport |
| Upload transport | Multipart REST via Multer `FileInterceptor` (memory storage) | GraphQL `Upload`; base64 in JSON | Standard for binaries; no payload bloat; no extra Apollo upload dependency |
| Download transport | `GET /files/:id/content` streams bytes with `Content-Type` | Base64 in a query; public URL | Matches DB storage now; future S3 adapter can 302-redirect to the object URL |
| Mutability | Immutable (upload + delete only) | `UpdateFile` replacing bytes | Simpler; an edited image is a new resource. Avoids partial-write states across two tables |
| Ownership link | Standalone (`id` + `url`); no `ownerType`/`ownerId` | Polymorphic owner now | Decision: minimal coupling. Consumers keep storing the `url` (as `plant-image-url` does today) |
| Tenant isolation | `createTenantRepository` on metadata repos AND content repo | Non-tenant repos | Files are space-scoped; a file MUST NOT be readable/downloadable cross-space |
| Bytes through the command | `UploadFileCommand` carries a `Buffer content` alongside metadata VOs | A `FileContentValueObject` wrapping the buffer | Bytes are transient transport→port payload, never an aggregate field; wrapping adds no invariant. Documented exception to the "command fields are VOs" rule |
| MCP exposure | `file_find_by_id`, `file_list`, `file_delete` only | Expose upload too | Binary multipart upload is a poor fit for an MCP tool arg; read/delete satisfy the repo's MCP rule |

## Data Flow

```
UPLOAD
POST /files (multipart)
  └─ JwtAuthGuard + SpaceGuard + FileInterceptor(limits+fileFilter)
       └─ Controller (@CurrentUser → userId, SpaceContext → spaceId)
            └─ CommandBus → UploadFileHandler
                 ├─ FileBuilder → FileAggregate (generates id, storageKey)  ── create() emits FileUploaded
                 ├─ WriteRepo(tenant).save(aggregate)            → files row (metadata)
                 ├─ FileStoragePort.save({ key, bytes, mimeType }) → file_contents row (bytea)
                 └─ url = FileStoragePort.resolveUrl(key)        → returns { id, url }

DOWNLOAD
GET /files/:id/content
  └─ JwtAuthGuard + SpaceGuard
       └─ Controller
            ├─ QueryBus → FileFindByIdQuery        → FileViewModel (tenant, 404 if absent)
            ├─ QueryBus → FileFindContentByIdQuery  → Buffer (via FileStoragePort.read)
            └─ res.set('Content-Type', mimeType).send(buffer)

DELETE
DELETE /files/:id
  └─ CommandBus → DeleteFileHandler
       ├─ AssertFileExistsService (write repo, 404)   ── delete() emits FileDeleted
       ├─ FileStoragePort.delete(storageKey)           → drop file_contents row
       └─ WriteRepo(tenant).delete(id)                 → drop files row
```

## File Changes

All new under `src/contexts/files/`. Tree (≈55 files incl. tests):

```
domain/
  aggregates/file.aggregate.ts                       # create() emits FileUploaded; delete() emits FileDeleted
  builders/file.builder.ts
  enums/file-mime-type.enum.ts                        # IMAGE_JPEG | IMAGE_PNG | IMAGE_WEBP
  events/file-uploaded/file-uploaded.event.ts
  events/file-deleted/file-deleted.event.ts
  events/interfaces/file-event-data.interface.ts
  exceptions/file-not-found.exception.ts              # 404
  exceptions/unsupported-file-type.exception.ts       # 400 (domain-level mime guard)
  exceptions/file-too-large.exception.ts              # 400 (domain-level size guard)
  interfaces/file.interface.ts                        # IFile (VO-typed fields)
  primitives/file.primitives.ts                       # IFilePrimitives extends BasePrimitives
  repositories/read/file-read.repository.ts           # IFileReadRepository + FILE_READ_REPOSITORY
  repositories/write/file-write.repository.ts         # IFileWriteRepository + FILE_WRITE_REPOSITORY
  value-objects/file-id/file-id.value-object.ts
  value-objects/file-name/file-name.value-object.ts
  value-objects/file-mime-type/file-mime-type.value-object.ts
  value-objects/file-size/file-size.value-object.ts
  value-objects/file-storage-key/file-storage-key.value-object.ts
  value-objects/file-url/file-url.value-object.ts
  view-models/file.view-model.ts
application/
  ports/file-storage.port.ts                          # IFileStoragePort + FILE_STORAGE_PORT
  ports/save-file-content.input.ts                    # SaveFileContentInput (one-type-per-file)
  commands/upload-file/upload-file.command.ts         # metadata VOs + content: Buffer
  commands/upload-file/upload-file.handler.ts
  commands/delete-file/delete-file.command.ts
  commands/delete-file/delete-file.handler.ts
  queries/file-find-by-id/file-find-by-id.query.ts
  queries/file-find-by-id/file-find-by-id.handler.ts
  queries/file-find-content-by-id/file-find-content-by-id.query.ts
  queries/file-find-content-by-id/file-find-content-by-id.handler.ts
  queries/file-find-by-criteria/file-find-by-criteria.query.ts
  queries/file-find-by-criteria/file-find-by-criteria.handler.ts
  services/write/assert-file-exists/assert-file-exists.service.ts
  services/read/assert-file-view-model-exists/assert-file-view-model-exists.service.ts
infrastructure/
  adapters/database-file-storage.adapter.ts           # implements IFileStoragePort over file_contents (bytea)
  config/files.config.ts                              # FilesConfig (max size, allowed mime, public base url)
  persistence/typeorm/entities/file.entity.ts         # files (metadata)
  persistence/typeorm/entities/file-content.entity.ts # file_contents (bytea)
  persistence/typeorm/mappers/file-typeorm.mapper.ts
  persistence/typeorm/repositories/file-typeorm-write.repository.ts
  persistence/typeorm/repositories/file-typeorm-read.repository.ts
transport/
  rest/controllers/files.controller.ts                # upload, list, metadata, content, delete
  rest/dtos/file-criteria.dto.ts
  rest/dtos/file-rest-response.dto.ts
  rest/dtos/upload-file-response.dto.ts               # { id, url }
  rest/mappers/file/file.mapper.ts
  rest/pipes/image-file-validation.pipe.ts            # ParseFilePipe-based mime/size guard
  graphql/resolvers/file-queries.resolver.ts
  graphql/resolvers/file-mutations.resolver.ts        # deleteFile only (no GraphQL upload)
  graphql/dtos/requests/file-criteria-graphql.dto.ts
  graphql/dtos/responses/file.response.dto.ts
  graphql/mappers/file.mapper.ts
  graphql/enums/file-registered-enums.graphql.ts
  mcp/tools/file-find-by-id.mcp-tool.ts
  mcp/tools/file-list.mcp-tool.ts
  mcp/tools/file-delete.mcp-tool.ts
  mcp/schemas/file-find-by-id.schema.ts
  mcp/schemas/file-list.schema.ts
  mcp/schemas/file-delete.schema.ts
files.module.ts
README.md
```

| File | Action | Description |
|------|--------|-------------|
| `src/database/migrations/1780000000019-CreateFiles.ts` | Create | `files` (+ `IDX_files_space_id`) and `file_contents` (`bytea`, `file_id` pk, `space_id`, FK→files ON DELETE CASCADE) |
| `src/app.module.ts` | Modify | Register `FilesModule` |
| `src/contexts/files/README.md` | Create | Context walkthrough (per repo apply rule), using the auth README as template |

## Interfaces / Contracts

```ts
// domain/enums/file-mime-type.enum.ts
export enum FileMimeTypeEnum {
  IMAGE_JPEG = 'image/jpeg',
  IMAGE_PNG = 'image/png',
  IMAGE_WEBP = 'image/webp',
}

// application/ports/save-file-content.input.ts
export interface SaveFileContentInput {
  key: string;        // storageKey (file id for the DB adapter)
  bytes: Buffer;
  mimeType: string;
  spaceId: string;    // tenant scope for the content store
}

// application/ports/file-storage.port.ts
export const FILE_STORAGE_PORT = Symbol('FILE_STORAGE_PORT');
export interface IFileStoragePort {
  save(input: SaveFileContentInput): Promise<void>;
  read(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  resolveUrl(key: string): string;
}
// NOTE: no TypeORM / Postgres / S3 type appears here — that is the seam.

// domain/repositories/read/file-read.repository.ts
export const FILE_READ_REPOSITORY = Symbol('FILE_READ_REPOSITORY');
export type FileCriteria = {
  mimeType?: FileMimeTypeEnum;  // exact
  filename?: string;            // ILIKE %value%
  page?: number;
  limit?: number;
};
export interface IFileReadRepository extends IBaseReadRepository<FileViewModel> {
  findByCriteria(criteria: FileCriteria): Promise<FileViewModel[]>;
}

// domain/repositories/write/file-write.repository.ts
export const FILE_WRITE_REPOSITORY = Symbol('FILE_WRITE_REPOSITORY');
export interface IFileWriteRepository extends IBaseWriteRepository<FileAggregate> {}
```

**`files` entity columns**: `id` (uuid pk), `filename` (varchar 255 NOT NULL),
`mime_type` (varchar 100 NOT NULL), `size` (integer NOT NULL — bytes),
`storage_key` (varchar 512 NOT NULL), `url` (varchar 1024 NOT NULL),
`user_id` (uuid NOT NULL), `space_id` (uuid NOT NULL), `created_at`,
`updated_at`. Index on `space_id`.

**`file_contents` entity columns**: `file_id` (uuid pk, FK→`files.id` ON DELETE
CASCADE), `space_id` (uuid NOT NULL), `data` (`bytea` NOT NULL). Index on
`space_id`. Owned exclusively by `DatabaseFileStorageAdapter`.

**Aggregate**: VOs for every field. `create()` emits `FileUploaded`; `delete()`
emits `FileDeleted`. No `update()`. The byte buffer is never a field.

**Builder**: receives `IFilePrimitives`, wraps each field in its VO.

**`resolveUrl`** (DB adapter): returns
`` `${config.publicBaseUrl ?? ''}/api/files/${key}/content` ``.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `FileMimeTypeValueObject` (allowed image types accepted; `application/pdf`, `image/gif`, junk throw); `FileSizeValueObject` (0 / negative / over-max throw, in-range accepted); `FileNameValueObject` (empty/whitespace throws, max 255); `FileAggregate` (`create()` emits `FileUploaded`, `delete()` emits `FileDeleted`); `UploadFileHandler` (saves metadata, calls `FileStoragePort.save`, resolves url, returns `{id,url}`); `DeleteFileHandler` (port.delete + repo.delete; 404 on miss); `FileFindByIdHandler`/`FileFindContentByIdHandler`/`FileFindByCriteriaHandler`; `DatabaseFileStorageAdapter.resolveUrl` shape | Jest, `jest.Mocked<T>` |
| Integration | Metadata write/read tenant isolation (file in S1 invisible under S2); `filename` ILIKE filter; `mimeType` exact filter; `file_contents` `bytea` round-trip (bytes out == bytes in); content tenant isolation (S2 cannot `read` S1's key); `ON DELETE CASCADE` drops content when metadata deleted | Test DB + SpaceContext |
| E2E | `POST /files` multipart with a real PNG → 201 `{id,url}`; `GET /files/:id/content` returns same bytes + `Content-Type: image/png`; non-image (`text/plain`) → 400; oversize → 400/413; `GET /files` list + filters; `DELETE /files/:id` → 200 then content 404; cross-tenant download → 404; all guarded by `JwtAuthGuard` + `SpaceGuard` | supertest (multipart `.attach`) |
| Static | `files-no-cross-context-import.spec.ts`: no import from any other `@contexts/*` bounded context | Jest source scan |

## Migration / Rollout

Single additive migration `1780000000019`: `up()` creates `files` then
`file_contents` (with FK + indexes); `down()` drops `file_contents` then `files`.
No backfill, no impact on other contexts.

## Open Questions

- **MIME sniffing**: v1 trusts the declared MIME (validated against the
  allowlist). If spoofed images become a problem, add magic-byte sniffing in the
  validation pipe — does not affect the domain contract. *(Deferred, low risk.)*
- **S3 adapter URL semantics**: when the S3 adapter lands, decide public-bucket
  vs. signed URLs and TTL. The port (`resolveUrl(key): string`) already
  accommodates both. *(Out of scope for this change.)*
