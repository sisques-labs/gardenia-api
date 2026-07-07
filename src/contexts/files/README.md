# Files Context

## Purpose

The `files` context stores and serves **image files** (e.g. plant photos) within
a space. A **file** is a thin metadata record — `filename`, `mimeType`, `size`,
`storageKey`, `url` — whose raw bytes live behind a swappable storage backend.

Clients **upload** an image over a multipart REST endpoint and get back the
file's `id` and a resolved `url`; they **download** the bytes from a
byte-serving REST endpoint. The returned `url` is what other contexts store in
their own image fields (e.g. `plant-image-url`) — there is no link from this
context back to them.

This is a standalone bounded context with no cross-context dependencies (other
than the repo-wide auth guard / current-user allowlist). All data is
tenant-scoped via `SpaceContext`. Files are **immutable**: there is upload and
delete, no update.

## The storage port/adapter seam

The defining design point. Domain, application, and transport depend only on the
**`IFileStoragePort`** abstraction (`FILE_STORAGE_PORT` token):

```ts
interface IFileStoragePort {
  save(input: SaveFileContentInput): Promise<void>;
  read(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  resolveUrl(key: string): string;
}
```

Two adapters implement this port today:

- **`DatabaseFileStorageAdapter`** (default) persists bytes in PostgreSQL
  (`file_contents.data`, a `bytea` column).
- **`S3FileStorageAdapter`** persists bytes in an S3-compatible bucket (AWS S3,
  MinIO, LocalStack) via `@aws-sdk/client-s3`.

Both resolve the URL to the app's own download endpoint
(`/api/files/:id/content`) — never a presigned or public bucket URL, since
`resolveUrl` is **synchronous** and bypassing the app's `JwtAuthGuard` +
`SpaceGuard` would break tenant isolation. Each adapter is the **only** class
that touches its own byte storage backend.

`files.module.ts` binds `FILE_STORAGE_PORT` via a `useFactory` that reads
`FILES_STORAGE_DRIVER` (`database` default, or `s3`) from `filesConfig` and
instantiates the corresponding adapter. No domain, application, or transport
code changes when the driver toggles. The URL is an opaque locator to the
domain; the adapter decides what it points to.

For the S3 adapter, an object's key is `{keyPrefix?}/{spaceId}/{fileId}`
(space-prefixed for tenant isolation on a flat bucket); the `S3Client` itself
is a singleton built once from config via the `S3_CLIENT` token
(`s3-client.provider.ts`).

## Core aggregate

### `FileAggregate`

| Field | Type | Description |
|-------|------|-------------|
| `id` | `FileIdValueObject` | UUID generated on upload |
| `filename` | `FileNameValueObject` | Original upload name, 1–255 chars |
| `mimeType` | `FileMimeTypeValueObject` | `image/jpeg`, `image/png`, or `image/webp` |
| `size` | `FileSizeValueObject` | Bytes, > 0 (configurable max enforced at transport) |
| `storageKey` | `FileStorageKeyValueObject` | Opaque backend locator (the file id for the DB adapter) |
| `url` | `FileUrlValueObject` | Resolved public-facing locator |
| `userId` | `UuidValueObject` | Uploader (`@CurrentUser`) |
| `spaceId` | `UuidValueObject` | Space owning the file (`SpaceContext` ALS) |
| `createdAt` / `updatedAt` | `Date` | Managed by TypeORM |

Domain methods: `create()` → `FileUploadedEvent`; `delete()` → `FileDeletedEvent`.
There is no `update()`. The aggregate never carries the byte buffer.

`FileMimeTypeEnum` is the image-only allowlist (`IMAGE_JPEG`, `IMAGE_PNG`,
`IMAGE_WEBP`); any other MIME is rejected at the value-object level.

## Commands & Queries

| Type | Name | Notes |
|------|------|-------|
| Command | `UploadFile` | Builds the aggregate, persists metadata, stores bytes via the port, returns `{ id, url }` |
| Command | `DeleteFile` | Deletes bytes via the port + metadata; 404 if absent |
| Query | `FileFindById` | Metadata `FileViewModel` (tenant-scoped) |
| Query | `FileFindContentById` | Raw bytes via the port (used by the download endpoint) |
| Query | `FileFindByCriteria` | Paginated list; filters: `mimeType` (exact), `filename` (ILIKE) |

Events: `FileUploaded`, `FileDeleted`.

## Transport

### REST (`/api/files`, guarded by `JwtAuthGuard` + global `SpaceGuard`)

| Method | Path | Action | Success |
|--------|------|--------|---------|
| POST | `/files` | Upload (multipart `file` part) | 201 `{ id, url }` |
| GET | `/files` | List (filters `mimeType`, `filename`, `page`, `limit`) | 200 |
| GET | `/files/:id` | Metadata | 200 |
| GET | `/files/:id/content` | Stream bytes with `Content-Type` | 200 |
| DELETE | `/files/:id` | Delete | 200 |

Upload uses Multer (`FileInterceptor`, in-memory). `ImageFileValidationPipe`
enforces the configured MIME allowlist and max size (400 on violation).

### GraphQL (code-first, `JwtAuthGuard` + global `SpaceGuard`)

- Queries: `fileFindById(input)`, `filesFindByCriteria(input)`
- Mutation: `fileDelete(input)` → `MutationResponseDto`

Binary upload is **not** exposed over GraphQL — use the REST endpoint.

### MCP tools (`transport/mcp/`)

`file_find_by_id`, `file_list`, `file_delete`. Binary upload is not exposed as a
tool.

## Configuration

Read via `ConfigModule.forFeature(filesConfig)` (namespace `files`), all optional:

| Env var | Default | Meaning |
|---------|---------|---------|
| `FILES_MAX_SIZE_BYTES` | `10485760` (10 MB) | Max accepted upload size |
| `FILES_ALLOWED_MIME_TYPES` | `image/jpeg,image/png,image/webp` | MIME allowlist |
| `FILES_PUBLIC_BASE_URL` | `''` | Absolute base prepended to resolved URLs (S3-style); empty → app-relative |
| `FILES_STORAGE_DRIVER` | `database` | `database` or `s3`; unrecognized value falls back to `database` |
| `FILES_S3_BUCKET` | — | **Required when `FILES_STORAGE_DRIVER=s3`**; bootstrap fails fast if missing |
| `FILES_S3_REGION` | `us-east-1` | Bucket region |
| `FILES_S3_ENDPOINT` | unset | Custom endpoint override (MinIO/LocalStack compatibility) |
| `FILES_S3_FORCE_PATH_STYLE` | `false` | Set `true` for MinIO-style path addressing |
| `FILES_S3_ACCESS_KEY_ID` | unset | Omit to use the SDK default credential chain (e.g. IAM role) |
| `FILES_S3_SECRET_ACCESS_KEY` | unset | Omit to use the SDK default credential chain |
| `FILES_S3_KEY_PREFIX` | `''` | Optional shared base folder prepended to every object key |

S3 config is only validated when `FILES_STORAGE_DRIVER=s3`; the `database`
driver ignores absent S3 env vars entirely.

## Persistence

- `files` — metadata table (`IDX_files_space_id`).
- `file_contents` — `bytea` bytes, `file_id` PK with FK → `files(id)` ON DELETE
  CASCADE (`IDX_file_contents_space_id`). Owned by `DatabaseFileStorageAdapter`.

Both repos and the content store are wrapped with `createTenantRepository`, so a
file is invisible and un-downloadable outside its space. Migration:
`1780000000019-CreateFiles`.

## Tests

- Unit (`src/contexts/files/**/*.spec.ts`): value objects, aggregate, handlers,
  the DB and S3 adapters (`resolveUrl`, save/read/delete), `filesConfig`
  (driver selection + fail-fast S3 validation), and a no-cross-context-import
  guard.
- Integration (`test/integration/files/`): metadata tenant isolation + filters;
  `bytea` round-trip; content tenant isolation; ON DELETE CASCADE.
- E2E (`test/e2e/files/`): REST upload/download/list/delete + validation +
  tenant isolation; GraphQL queries + delete.

## Out of scope (v1)

Polymorphic ownership (`ownerType`/`ownerId`), wiring `plants`/`plant-species`
to upload here, migrating existing DB-stored files to S3, LocalStack/MinIO
integration-test infrastructure, image processing (thumbnails/resize/EXIF),
signed/public URLs, non-image types, and content-hash dedup.
