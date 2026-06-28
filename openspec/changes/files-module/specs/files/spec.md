# Files — Tenant-scoped image upload, storage, and serving

**Source change:** files-module
**Created:** 2026-06-25

---

## Requirements

### Requirement: FileAggregate Fields and Validation

The `FileAggregate` MUST carry: `id` (UUID, generated), `filename` (non-empty
string, trimmed, max 255 chars — the original upload name), `mimeType`
(`FileMimeTypeEnum`), `size` (integer bytes, > 0, ≤ the configured maximum),
`storageKey` (opaque backend locator string), `url` (resolved public-facing
locator string), `userId` (UUID, the uploader), `spaceId` (UUID, tenant scope),
`createdAt`, `updatedAt`.

The aggregate MUST NOT carry the file's byte content; bytes are owned by the
storage port, never by the aggregate.

The aggregate is immutable after creation: there is no update operation that
mutates its fields or replaces its bytes.

The system MUST reject `filename` that is empty or whitespace-only after trim.
The system MUST reject `size` that is `<= 0` or greater than the configured
maximum.

#### Scenario: Valid file aggregate

- GIVEN filename="rose.png", mimeType=image/png, size=204800, a storageKey and url
- WHEN a `FileAggregate` is built
- THEN all fields are set and the aggregate is valid

#### Scenario: Empty filename rejected

- GIVEN a whitespace-only filename
- WHEN a `FileAggregate` is built
- THEN a domain validation error is thrown

#### Scenario: Non-positive size rejected

- GIVEN size=0
- WHEN a `FileAggregate` is built
- THEN a domain validation error is thrown

---

### Requirement: FileMimeTypeEnum (image-only allowlist)

The system MUST support exactly: `image/jpeg`, `image/png`, `image/webp`
(enum members `IMAGE_JPEG`, `IMAGE_PNG`, `IMAGE_WEBP`).

Any MIME type outside this set MUST be rejected at the value-object level.

#### Scenario: Allowed image type accepted

- GIVEN mime value `"image/webp"`
- WHEN `FileMimeTypeValueObject` is constructed
- THEN no error is thrown

#### Scenario: Non-image type rejected

- GIVEN mime value `"application/pdf"`
- WHEN `FileMimeTypeValueObject` is constructed
- THEN a domain validation error is thrown

#### Scenario: Disallowed image type rejected

- GIVEN mime value `"image/gif"`
- WHEN `FileMimeTypeValueObject` is constructed
- THEN a domain validation error is thrown

---

### Requirement: Configurable Size Limit

The maximum accepted file size MUST be configurable via `FILES_MAX_SIZE_BYTES`
(default 10485760 = 10 MB). The allowed MIME allowlist MUST be configurable via
`FILES_ALLOWED_MIME_TYPES` (default `image/jpeg,image/png,image/webp`).

The limit MUST be enforced at the transport boundary (Multer `limits.fileSize`
and a validation pipe) AND at the domain boundary (`FileSizeValueObject`), so an
oversize file is rejected even if it reaches the domain.

#### Scenario: Oversize file rejected at transport

- GIVEN `FILES_MAX_SIZE_BYTES=10485760` and an 11 MB upload
- WHEN `POST /files` is called
- THEN the request is rejected with 400 (or 413) and nothing is persisted

#### Scenario: In-range size accepted

- GIVEN a 2 MB PNG
- WHEN `POST /files` is called
- THEN the file is accepted and stored

---

### Requirement: Storage Port / Adapter Seam

The domain, application, and transport layers MUST depend only on the
`IFileStoragePort` abstraction (`FILE_STORAGE_PORT` DI token) for byte storage —
`save`, `read`, `delete`, and `resolveUrl`. The port signature MUST NOT expose
any TypeORM, Postgres, or storage-vendor type.

The v1 implementation MUST be `DatabaseFileStorageAdapter`, persisting bytes in
PostgreSQL and resolving the URL to the download endpoint
(`/api/files/:id/content`, optionally prefixed by `FILES_PUBLIC_BASE_URL`). The
adapter MUST be the only class that accesses raw byte storage.

Replacing the storage backend (e.g. S3) MUST require only a new adapter
implementing `IFileStoragePort` and a `useClass` rebinding of `FILE_STORAGE_PORT`
— with no change to domain, application, or transport.

#### Scenario: Layers depend on the port, not the adapter

- GIVEN the source under `src/contexts/files/{domain,application,transport}/`
- WHEN scanned for imports
- THEN no file imports `DatabaseFileStorageAdapter` or any `bytea`/TypeORM content type; only `IFileStoragePort` / `FILE_STORAGE_PORT` are referenced

#### Scenario: DB adapter resolves the download URL

- GIVEN a stored file with id `abc`
- WHEN `DatabaseFileStorageAdapter.resolveUrl("abc")` is called
- THEN it returns `/api/files/abc/content` (optionally prefixed with the configured public base URL)

---

### Requirement: UploadFile Command

Any authenticated space member MAY upload a file.

The command MUST accept `filename`, `mimeType`, `size`, the byte `content`, with
`userId` from `@CurrentUser` and `spaceId` from `SpaceContext` ALS — never from
the request payload.

On success the handler MUST: build the `FileAggregate` (generating `id` and
`storageKey`), persist the metadata via the tenant-scoped write repository, store
the bytes via `FileStoragePort.save(...)`, resolve the `url` via
`FileStoragePort.resolveUrl(...)`, emit `FileUploaded`, and return `{ id, url }`.

#### Scenario: Happy path

- GIVEN an authenticated user who is a member of the active space
- WHEN `UploadFile` is dispatched with a valid PNG
- THEN the metadata is persisted, the bytes are stored via the port, `FileUploaded` is emitted, and `{ id, url }` is returned

#### Scenario: Non-image rejected

- GIVEN a `text/plain` upload
- WHEN `UploadFile` is dispatched
- THEN a 400 Bad Request is returned and nothing is persisted

---

### Requirement: DeleteFile Command

Any authenticated space member MAY delete any file in the space.

The handler MUST load the file via the tenant-scoped repository; if not found,
throw `FileNotFoundException` (404). On success it MUST delete the bytes via
`FileStoragePort.delete(storageKey)`, delete the metadata, and emit
`FileDeleted`.

#### Scenario: Member deletes a file

- GIVEN an authenticated space member and an existing file in the space
- WHEN `DeleteFile` is dispatched
- THEN the metadata and the bytes are both removed and `FileDeleted` is emitted

#### Scenario: File not found

- GIVEN a fileId that does not exist in the active space
- WHEN `DeleteFile` is dispatched
- THEN `FileNotFoundException` is thrown and 404 is returned

---

### Requirement: FileFindById Query

Returns a single `FileViewModel` (metadata only — no bytes) for the given id,
scoped to the active space.

#### Scenario: Found in space

- GIVEN a fileId that exists in the active space
- WHEN `FileFindById` is dispatched
- THEN a `FileViewModel` is returned with all metadata fields (including `url`)

#### Scenario: Not found or wrong space

- GIVEN a fileId that does not exist in the active space
- WHEN `FileFindById` is dispatched
- THEN `FileNotFoundException` is thrown and 404 is returned

---

### Requirement: FileFindContentById Query

Returns the raw bytes (`Buffer`) of the file with the given id, scoped to the
active space, read via `FileStoragePort.read(storageKey)`. Used by the
content-serving endpoint.

#### Scenario: Content returned for an existing file

- GIVEN a fileId that exists in the active space
- WHEN `FileFindContentById` is dispatched
- THEN the original bytes are returned

#### Scenario: Content of a missing file

- GIVEN a fileId that does not exist in the active space
- WHEN `FileFindContentById` is dispatched
- THEN `FileNotFoundException` is thrown and 404 is returned

---

### Requirement: FileFindByCriteria Query

Returns a paginated list of `FileViewModel` (metadata) for the active space.

Supported filters (all optional):
- `mimeType`: exact match on `FileMimeTypeEnum` value
- `filename`: partial case-insensitive match (ILIKE `%value%`)

Default pagination: `page=1`, `limit=20`, max `limit=100`. An empty result MUST
return 200 with an empty list, not 404.

#### Scenario: Returns files for active space only

- GIVEN files in Space A and Space B
- WHEN `FileFindByCriteria` is dispatched under Space A context
- THEN only Space A files are returned

#### Scenario: mimeType filter

- GIVEN a PNG and a JPEG
- WHEN criteria `mimeType=image/png` is applied
- THEN only the PNG is returned

#### Scenario: filename partial filter

- GIVEN files "rose-front.png" and "tomato.png"
- WHEN criteria `filename="rose"` is applied
- THEN only "rose-front.png" is returned

#### Scenario: Empty result returns 200

- GIVEN no files in the active space
- WHEN `FileFindByCriteria` is dispatched
- THEN 200 is returned with an empty list

---

### Requirement: REST Transport

The system MUST expose the following endpoints, all guarded by `JwtAuthGuard` and
`SpaceGuard`:

| Method | Path | Handler | Success Code |
|--------|------|---------|--------------|
| POST | /files | UploadFile (multipart, field `file`) | 201 |
| GET | /files | FileFindByCriteria | 200 |
| GET | /files/:id | FileFindById | 200 |
| GET | /files/:id/content | FileFindContentById (streams bytes) | 200 |
| DELETE | /files/:id | DeleteFile | 200 |

`POST /files` MUST consume `multipart/form-data` with a single file part named
`file`, processed via Multer (`FileInterceptor`) with `limits.fileSize` and a
MIME `fileFilter`. The 201 response body MUST be `{ id, url }`.

`GET /files/:id/content` MUST set `Content-Type` to the stored `mimeType` and
respond with the raw bytes.

All endpoints MUST require the `X-Space-ID` header. `@CurrentUser` supplies
`userId`. JSON response bodies (other than the content endpoint) MUST use
`FileRestResponseDto` mapped from `FileViewModel`.

#### Scenario: Upload then download round-trip

- GIVEN an authenticated space member
- WHEN they `POST /files` a PNG and then `GET` the returned `url`'s content endpoint
- THEN the downloaded bytes equal the uploaded bytes and `Content-Type` is `image/png`

---

### Requirement: GraphQL Transport

The system MUST expose GraphQL operations guarded by `JwtAuthGuard` and
`SpaceGuard`:

**Queries**: `file(id: ID!): FileType`,
`files(criteria: FileCriteriaInput): PaginatedFilesResult`

**Mutations**: `deleteFile(id: ID!): MutationResponseDto`

Binary upload is NOT exposed over GraphQL (use the REST multipart endpoint).
`FileType` MUST include all `FileViewModel` metadata fields. `FileMimeTypeEnum`
MUST be registered with `registerEnumType`. Schema MUST be generated via
`autoSchemaFile` (code-first). Resolvers MUST dispatch exclusively via
`CommandBus`/`QueryBus`.

---

### Requirement: MCP Tools

The `files` context MUST expose its public read/delete operations as MCP tools
under `transport/mcp/`: `file_find_by_id`, `file_list`, `file_delete`. Each tool
implements `IMcpTool`, is tagged `@McpTool()` + `@Injectable()`, reads the
authenticated user/space from the injected `IMcpToolContext`, dispatches via
`CommandBus`/`QueryBus` only, and has its Zod schema in its own file under
`transport/mcp/schemas/`. Binary upload MUST NOT be exposed as an MCP tool.

#### Scenario: List tool returns space files

- GIVEN files exist in the caller's active space
- WHEN the `file_list` MCP tool is invoked
- THEN it returns the space's file metadata via the QueryBus

---

### Requirement: Tenant Isolation

All file metadata reads/writes AND byte content reads/writes MUST be scoped to
the active `spaceId` via `createTenantRepository`. A file uploaded under Space A
MUST NOT be visible or downloadable under Space B.

#### Scenario: Cross-tenant invisibility

- GIVEN a file uploaded under Space A
- WHEN `FileFindById` (or the content endpoint) is invoked under Space B context with the same id
- THEN `FileNotFoundException` is thrown (404)

---

### Requirement: No Cross-Context Coupling

The `files` bounded context MUST NOT import from any other bounded context under
`@contexts/*`. Consumers (e.g. `plants`, `plant-species`) keep storing the
returned `url` in their own existing fields; this change wires no consumer to the
module.

#### Scenario: No forbidden imports

- GIVEN the source tree under `src/contexts/files/`
- WHEN scanned for imports
- THEN no import path matches another `@contexts/<other>/` bounded context

---

## Out of Scope

- Polymorphic ownership (`ownerType`/`ownerId`) linking files to domain entities
- Wiring `plants` / `plant-species` to upload through this module
- S3 / MinIO / object-storage adapter (the port is designed for it; not shipped)
- Image processing (thumbnails, resize, EXIF strip, format conversion)
- Public/unauthenticated or signed download URLs
- Non-image file types (PDF, video)
- Content-hash deduplication
- MIME magic-byte sniffing (declared MIME is trusted against the allowlist in v1)
