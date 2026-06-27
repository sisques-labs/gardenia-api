# Proposal: Files Module (`files`)

## Intent

Gardenia needs to let users attach photos to their garden data (plant photos,
species reference images, harvest snapshots, etc.). Today image fields like
`plant-image-url` / `plant-species-image-url` are bare strings that point
*somewhere* — but nothing in the platform actually accepts, stores, or serves a
binary file. There is no way for a client to upload a picture and get back a URL
it can persist.

This change introduces a **tenant-scoped `files` bounded context**: a standalone
module that accepts an uploaded image over multipart REST, validates it (image
MIME types only, max size), stores it, and serves it back as bytes over a REST
download endpoint. On upload it returns the file's `id` and a resolved `url`
that other contexts can store in their existing `*-image-url` fields exactly as
they do today.

The defining architectural decision is a **storage port/adapter seam**. The
domain and application layers depend only on a `FileStoragePort` abstraction —
"save these bytes, read these bytes, delete them, resolve a URL for them". The
**v1 adapter persists bytes in PostgreSQL** (a `bytea` column) and resolves the
URL to the download endpoint (`/api/files/:id`). A future S3/MinIO adapter can be
dropped in — uploading to a bucket and resolving to a real (or signed) object URL
— **without touching domain, application, or transport**. The URL is an opaque
locator to the domain; the adapter decides what it points to.

## Scope

### In Scope
- New `files` bounded context (domain → application → infrastructure → transport).
- `FileAggregate` fields: `id` (UUID), `filename` (original name, non-empty, max
  255 chars), `mimeType` (`FileMimeTypeEnum` — image types only), `size` (bytes,
  > 0, ≤ configured max), `storageKey` (opaque backend locator), `url` (resolved
  public-facing locator), `userId` (uploader), `spaceId` (tenant scope),
  `createdAt`, `updatedAt`. Files are **immutable** — no update command.
- `FileMimeTypeEnum`: `IMAGE_JPEG | IMAGE_PNG | IMAGE_WEBP`
  (`image/jpeg`, `image/png`, `image/webp`).
- **Storage port/adapter seam**: `FileStoragePort` (`save` / `read` / `delete` /
  `resolveUrl`) in `application/ports/`; `DatabaseFileStorageAdapter`
  (PostgreSQL `bytea`) in `infrastructure/adapters/`, bound to the port DI token
  via `useClass`.
- Commands: `UploadFile` (multipart, returns `id` + `url`), `DeleteFile`.
- Queries: `FileFindById` (metadata view model), `FileFindContentById` (bytes,
  for the download endpoint), `FileFindByCriteria` (filters: `mimeType`,
  `filename` partial match; paginated).
- Events: `FileUploaded`, `FileDeleted`.
- REST transport: `POST /files` (multipart upload), `GET /files` (list),
  `GET /files/:id` (metadata JSON), `GET /files/:id/content` (streams bytes with
  `Content-Type`), `DELETE /files/:id`. Guards: `JwtAuthGuard` + `SpaceGuard`.
- MCP tools: `file_find_by_id`, `file_list`, `file_delete` (binary upload is NOT
  exposed as an MCP tool).
- Validation: image MIME types only, size ≤ configurable max (default 10 MB),
  enforced at Multer (`limits` + `fileFilter`), DTO, and domain VO levels.
- Config: `FilesConfig` (`FILES_MAX_SIZE_BYTES`, `FILES_ALLOWED_MIME_TYPES`,
  optional `FILES_PUBLIC_BASE_URL`) read from env.
- TypeORM entities + migration `1780000000019-CreateFiles` (`files` metadata
  table + `file_contents` `bytea` table), both with `space_id`; tenant isolation
  via `createTenantRepository`.
- Register `FilesModule` in `src/app.module.ts`.

### Out of Scope
- **Polymorphic ownership** (`ownerType` / `ownerId` linking a file to a plant,
  species, etc.) — v1 is standalone; consumers keep storing the returned `url`
  in their own fields, as they do today. Deferred.
- **Wiring `plants` / `plant-species` to upload through this module** — their
  `*-image-url` fields keep accepting any string; switching them to call `files`
  is a follow-up change.
- **S3 / MinIO / object-storage adapter** — the port is designed for it, but only
  the PostgreSQL adapter ships now.
- **Image processing**: thumbnails, resizing, EXIF stripping, format conversion.
- **Public/unauthenticated URLs and signed URLs** — downloads are authenticated
  and space-scoped in v1; signed-URL resolution belongs to the future S3 adapter.
- **Non-image files** (PDF, video) — MIME allowlist is image-only by decision.
- **Deduplication / content-hash addressing.**

## Capabilities

### New Capabilities
- `files`: Tenant-scoped upload, retrieval, listing, and deletion of image files,
  with a storage port/adapter seam (PostgreSQL adapter in v1) so the storage
  backend can change without touching domain/application/transport. REST upload +
  byte-serving download, plus read/delete MCP tools.

### Modified Capabilities
- None. `files` is fully standalone; no existing context is modified beyond
  registering `FilesModule` in `AppModule`.

## Approach

- **Storage seam**: domain/application depend on `IFileStoragePort`
  (`FILE_STORAGE_PORT` Symbol). `DatabaseFileStorageAdapter` implements it over a
  dedicated `file_contents` (`bytea`) table, keyed by `file_id`, and resolves the
  URL to `${FILES_PUBLIC_BASE_URL ?? ''}/api/files/:id/content`. Swapping to S3
  means a new adapter + `useClass` swap; nothing else changes.
- **Metadata vs. bytes**: file metadata lives in the `files` table behind the
  standard read/write repositories; raw bytes live behind the storage port (in
  `file_contents` for the DB adapter). The metadata aggregate never carries the
  byte buffer — bytes flow command → port only.
- **Upload flow**: Multer (memory storage) receives the part; `fileFilter` +
  `limits` reject non-images and oversize early; the controller dispatches
  `UploadFileCommand`; the handler builds the `FileAggregate` (generating `id`
  and `storageKey`), persists metadata, calls `FileStoragePort.save(...)`,
  resolves the `url`, and returns `{ id, url }`.
- **Download flow**: `GET /files/:id/content` dispatches `FileFindByIdQuery`
  (tenant-scoped metadata, 404 if absent) then `FileFindContentByIdQuery` (bytes
  via the port) and streams them with the stored `mimeType` as `Content-Type`
  (mirrors the existing QR PNG-serving pattern).
- **Tenant isolation**: `createTenantRepository` on both the metadata repos and
  the content repo, so a file uploaded under Space A is invisible (and
  un-downloadable) under Space B.
- **Immutability**: no `UpdateFile` command; to change an image, upload a new
  file and delete the old one.
- **Validation depth**: Multer limits/fileFilter (transport) → DTO
  (`class-validator`) → `FileMimeTypeValueObject` / `FileSizeValueObject`
  (domain), so an invalid file is rejected even if it reaches the domain.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/contexts/files/` | New | Full bounded context incl. storage port + DB adapter |
| `src/database/migrations/1780000000019-CreateFiles.ts` | New | `files` metadata table + `file_contents` `bytea` table, both with `space_id` |
| `src/app.module.ts` | Modified | Register `FilesModule` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large `bytea` blobs bloat Postgres / slow queries | Med | Bytes isolated in `file_contents`; metadata queries never `SELECT` bytes; documented as the reason the S3 adapter exists; 10 MB cap |
| Missing `createTenantRepository` → cross-tenant file leak | Med | Integration test asserting tenant isolation on metadata read/write AND content read |
| MIME spoofing (declared `image/png`, real payload not) | Low | v1 trusts declared MIME validated against allowlist; magic-byte sniffing deferred (documented) |
| Unbounded upload size → memory pressure (memory storage) | Low | Multer `limits.fileSize` rejects before buffering completes; cap configurable |
| Migration timestamp conflict | Low | Highest existing is `1780000000018`; use `...0019` |
| Passing a `Buffer` through a command breaks the "fields are VOs" rule | Low | Documented exception: bytes are transient transport→port payload, never an aggregate field; metadata fields remain VOs |

## Rollback Plan

Revert the branch; run migration `down()` (drops `file_contents` then `files`).
Additive and isolated — no other table is touched, so no data backfill or
cross-context cleanup is required.

## Dependencies

- `@nestjs/platform-express` Multer (`FileInterceptor`) — bundled with NestJS;
  no new runtime dependency expected.
- Reuses `JwtAuthGuard`, `SpaceGuard`, `@CurrentUser`, `SpaceContext`,
  `createTenantRepository`, `BaseAggregate` / `BaseBuilder`, the `@core/mcp`
  toolkit, and the `MutationResponseGraphQLMapper` conventions.

## Success Criteria

- [ ] A client can `POST /files` a JPEG/PNG/WebP and receive `{ id, url }`.
- [ ] `GET /files/:id/content` streams the original bytes with the correct
      `Content-Type`.
- [ ] Domain/application/transport depend only on `FileStoragePort`; the only
      class that touches `bytea` is `DatabaseFileStorageAdapter`.
- [ ] Swapping the storage backend requires only a new adapter + `useClass` bind
      (proven by the port having no Postgres/TypeORM types in its signature).
- [ ] Non-image MIME types and files over the configured max are rejected with
      400 at the transport boundary.
- [ ] Reads/writes (metadata and content) are tenant-isolated via
      `createTenantRepository` (integration test proves it).
- [ ] `file_find_by_id`, `file_list`, `file_delete` exposed as MCP tools; upload
      is not.
- [ ] Unit, integration, and e2e tests green.
