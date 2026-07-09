# Tasks: S3 File Storage Adapter (`s3-file-storage-adapter`)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350 – 420 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (additive, isolated to `files` context; no existing caller changes) |
| Delivery strategy | ask-on-risk |
| Chain strategy | not applicable — single PR |

Decision needed before apply: No (best estimate lands at/near the 400-line budget; flagged for visibility, not blocking)
Chained PRs recommended: No
400-line budget risk: Medium

Rough breakdown driving the estimate: `s3-file-storage.adapter.ts` (~90 lines) + `s3-file-storage.adapter.spec.ts` (~120 lines) + `s3-client.provider.ts` (~25 lines) + `files.config.ts` diff (~35 lines) + `files.config.spec.ts` diff/new (~40 lines) + `files.module.ts` diff (~30 lines) + `package.json` diff (~2 lines) + `README.md` diff (~20 lines) ≈ 360 lines, with reasonable slack up to ~420. If implementation grows past 450 lines (e.g. adapter spec expands significantly), flag to the orchestrator to reconsider chaining rather than pushing a >400-line single PR silently.

### Suggested Work Units

| Unit | Goal | Notes |
|------|------|-------|
| 1 | Dependency + config | `package.json`, `files.config.ts` (+ spec) |
| 2 | S3 client provider | `s3-client.provider.ts` |
| 3 | Adapter + unit tests | `s3-file-storage.adapter.ts` + `.spec.ts` |
| 4 | Module wiring + docs | `files.module.ts`, `README.md` |
| 5 | Regression check | Existing `database`-driver tests/behavior unaffected |

All units are sequential (each depends on the prior — config before client, client before adapter, adapter before wiring) and small enough to ship as a single PR; no parallelization needed given the size.

---

## Phase 1: Dependency & Configuration

- [x] 1.1 Modify `package.json` — add `@aws-sdk/client-s3` (latest stable v3) to `dependencies`
- [x] 1.2 Modify `src/contexts/files/infrastructure/config/files.config.ts` — add `FilesStorageDriver` type (`'database' | 's3'`), `DEFAULT_FILES_STORAGE_DRIVER = 'database'`, `DEFAULT_FILES_S3_REGION = 'us-east-1'`; extend the `registerAs('files', ...)` factory to read `FILES_STORAGE_DRIVER` (unrecognized/unset → `'database'`), and a nested `s3` config object (`bucket`, `region`, `endpoint`, `forcePathStyle`, `accessKeyId`, `secretAccessKey`, `keyPrefix`) per the design's env var table; throw a clear `Error` at factory-eval time when `storageDriver === 's3'` and `s3.bucket` is empty (fail-fast, satisfies spec's "S3 driver selected with missing bucket fails fast" scenario); when driver is `database`, missing S3 env vars MUST NOT throw
- [x] 1.3 Create/extend `src/contexts/files/infrastructure/config/files.config.spec.ts` (or existing spec file if one exists) — unit tests: default `storageDriver` is `database` when env var unset; unrecognized value (`azure`) falls back to `database`; `s3` + missing bucket throws; `s3` + bucket set does not throw; env parsing for `endpoint`/`forcePathStyle`/`keyPrefix`/credentials produces expected shape

_Satisfies spec requirement "S3 Adapter Configuration" (all 3 scenarios) — GDN-45._

---

## Phase 2: S3 Client Provider

- [x] 2.1 Create `src/contexts/files/infrastructure/config/s3-client.provider.ts` — export `S3_CLIENT` Symbol token and `s3ClientProvider: Provider` (`useFactory` injecting `filesConfig.KEY`, returns a singleton `S3Client` built from `config.s3.region`/`endpoint`/`forcePathStyle`/credentials, falling back to the SDK default credential chain when `accessKeyId`/`secretAccessKey` are unset)

_Supports spec requirement "S3FileStorageAdapter Implements IFileStoragePort" (client dependency) — GDN-45._

---

## Phase 3: S3 Adapter

- [x] 3.1 Create `src/contexts/files/infrastructure/adapters/s3-file-storage.adapter.ts` — `@Injectable() class S3FileStorageAdapter implements IFileStoragePort`; constructor injects `@Inject(S3_CLIENT) s3: S3Client`, `SpaceContext`, `@Inject(filesConfig.KEY) config: FilesConfig` (hydration only); `save(input)` issues `PutObjectCommand` with `Key = buildKey(input.spaceId, input.key)`; `read(key)` issues `GetObjectCommand` scoped via `spaceContext.require()`, returns `Buffer` via `transformToByteArray()`, catches `NoSuchKey`/404 → `null`, rethrows all other errors; `delete(key)` issues `DeleteObjectCommand` scoped via `spaceContext.require()` (idempotent, no existence pre-check); `resolveUrl(key)` returns `` `${config.publicBaseUrl}/api/files/${key}/content` `` (sync, identical shape to `DatabaseFileStorageAdapter`); private `buildKey(spaceId, fileId)` applies optional `keyPrefix`; private `isNotFound(err)` checks `err.name === 'NoSuchKey'` or `err.$metadata?.httpStatusCode === 404`; log start/completion of each I/O call via `Logger` (no logging inside domain/assert layers — N/A here, this is infra); no `@aws-sdk/client-s3` types leak across the `IFileStoragePort` boundary
- [x] 3.2 Create `src/contexts/files/infrastructure/adapters/s3-file-storage.adapter.spec.ts` — co-located unit spec, `jest.Mocked` style, no `@nestjs/testing`; mock `S3Client` as `{ send: jest.fn() } as unknown as jest.Mocked<S3Client>`, stub `SpaceContext.require()`; cover: `save` sends `PutObjectCommand` with `Bucket`/`Key=${spaceId}/${fileId}`/`Body`/`ContentType`; `read` on hit returns `Buffer` from `transformToByteArray`; `read` on `NoSuchKey` returns `null`; `read` on other error rethrows; `delete` sends `DeleteObjectCommand` and does not throw when the key is already absent; `resolveUrl` returns the expected app-relative URL (with and without `publicBaseUrl`); `buildKey` applies `keyPrefix` when set

_Satisfies spec requirement "S3FileStorageAdapter Implements IFileStoragePort" (all 5 scenarios) — GDN-45._

---

## Phase 4: Module Wiring & Docs

- [x] 4.1 Modify `src/contexts/files/files.module.ts` — add `s3ClientProvider` and `S3FileStorageAdapter` to providers; replace the static `FILE_STORAGE_PORT` `useClass: DatabaseFileStorageAdapter` binding with a `useFactory` provider injecting `filesConfig.KEY`, the `FileContentTypeOrmEntity` repository token, `SpaceContext`, and `S3_CLIENT`, returning `new S3FileStorageAdapter(...)` when `config.storageDriver === 's3'` and `new DatabaseFileStorageAdapter(...)` otherwise (default); keep both adapter classes registered as providers for direct resolution; group additions into the existing named provider const arrays per project convention
- [x] 4.2 Modify `src/contexts/files/README.md` — document the env-selectable storage backend (`FILES_STORAGE_DRIVER`), the new S3 env vars table, and the `S3FileStorageAdapter`/`S3_CLIENT` seam, following the existing README structure (reflect current state of the context, not just the delta)

_Satisfies spec requirements "Env-Driven Adapter Selection" (all 4 scenarios) and "No Cross-Context or Layer Violations" — GDN-45._

---

## Phase 5: Regression Check

- [x] 5.1 Run the full `files` context unit suite (`pnpm test -- files`) and confirm existing `database-file-storage.adapter.spec.ts`, `upload-file.handler.spec.ts`, `delete-file.handler.spec.ts`, and other pre-existing specs are unaffected by the `useFactory` change
- [x] 5.2 Manually/via test confirm the default-driver scenarios: `FILES_STORAGE_DRIVER` unset → `FILE_STORAGE_PORT` resolves to `DatabaseFileStorageAdapter`; no S3 env vars set + `database` driver → module initializes without error (spec requirement "Database driver ignores absent S3 config")
- [x] 5.3 Confirm `files-no-cross-context-import.spec.ts` (existing static scan) still passes — `S3FileStorageAdapter` and `@aws-sdk/client-s3` are referenced only under `files/infrastructure/`

_Satisfies spec requirement "S3 Adapter Configuration" scenario "Database driver ignores absent S3 config" and confirms no regression to existing `IFileStoragePort` consumers per "Callers are adapter-agnostic"._
