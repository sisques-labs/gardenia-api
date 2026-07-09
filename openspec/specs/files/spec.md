# Files — S3 File Storage Adapter (delta)

**Source change:** s3-file-storage-adapter
**Created:** 2026-07-07
**Modifies capability:** `files` (adds a new storage adapter and env-driven selection; the `IFileStoragePort` contract is unchanged)

---

## Requirements

### Requirement: S3FileStorageAdapter Implements IFileStoragePort

The system MUST provide an `S3FileStorageAdapter` in
`src/contexts/files/infrastructure/adapters/` implementing `IFileStoragePort`
(`save`, `read`, `delete`, `resolveUrl`) using `@aws-sdk/client-s3`. The
adapter MUST be the only class that translates these calls into AWS S3 SDK
operations (`PutObjectCommand`, `GetObjectCommand`, `DeleteObjectCommand`).

`save(input: SaveFileContentInput)` MUST upload the given bytes to the
configured bucket under the input's storage key. `read(key)` MUST return the
object's bytes as a `Buffer`, or `null` if the object does not exist
(`NoSuchKey` / 404 from S3 MUST be translated to `null`, not thrown).
`delete(key)` MUST remove the object; deleting a key that does not exist MUST
NOT throw (idempotent delete, matching S3's own semantics).

Any other S3 SDK error (e.g. access denied, network failure, malformed
credentials) MUST propagate as an error — it MUST NOT be swallowed or
translated into a `null`/success result.

The adapter signature MUST NOT leak any `@aws-sdk/client-s3` type across the
port boundary; callers depending on `IFileStoragePort` MUST remain unaware
that S3 is in use.

#### Scenario: Save uploads bytes to the configured bucket

- GIVEN a `SaveFileContentInput` with a storage key and byte content
- WHEN `S3FileStorageAdapter.save(input)` is called
- THEN a `PutObjectCommand` is issued against the configured bucket with the given key and bytes

#### Scenario: Read returns bytes for an existing key

- GIVEN an object exists in the bucket under key `abc`
- WHEN `S3FileStorageAdapter.read("abc")` is called
- THEN the object's bytes are returned as a `Buffer`

#### Scenario: Read returns null for a missing key

- GIVEN no object exists in the bucket under key `missing`
- WHEN `S3FileStorageAdapter.read("missing")` is called
- THEN `null` is returned (the S3 `NoSuchKey` error is not thrown to the caller)

#### Scenario: Delete is idempotent

- GIVEN no object exists in the bucket under key `already-gone`
- WHEN `S3FileStorageAdapter.delete("already-gone")` is called
- THEN no error is thrown

#### Scenario: Unexpected S3 error propagates

- GIVEN the S3 client rejects a call with an access-denied error
- WHEN any `S3FileStorageAdapter` method triggers that call
- THEN the error propagates to the caller and is not translated into a successful/null result

---

### Requirement: S3 Adapter Configuration

`filesConfig` MUST support the following S3-related environment variables:
bucket name, region, credentials (access key id / secret access key, following
the credential shape used by `auth.config.ts`), and an optional custom
endpoint (to support S3-compatible services such as MinIO/LocalStack).

When the S3 adapter is selected (see adapter selection requirement below), the
system MUST fail fast at application bootstrap if a required S3 config value
(bucket or region) is missing or empty — it MUST NOT defer the failure to the
first request.

When the `database` adapter is selected, missing S3 env vars MUST NOT cause
any failure (S3 config is only validated when S3 is the active driver).

#### Scenario: S3 driver selected with complete config boots successfully

- GIVEN `FILES_STORAGE_DRIVER=s3` and all required S3 env vars set
- WHEN the application bootstraps
- THEN the module initializes without error and `S3FileStorageAdapter` is bound to `FILE_STORAGE_PORT`

#### Scenario: S3 driver selected with missing bucket fails fast

- GIVEN `FILES_STORAGE_DRIVER=s3` and the S3 bucket env var unset
- WHEN the application bootstraps
- THEN bootstrap fails with a clear configuration error before any request is served

#### Scenario: Database driver ignores absent S3 config

- GIVEN `FILES_STORAGE_DRIVER` unset (or `database`) and no S3 env vars set
- WHEN the application bootstraps
- THEN the module initializes successfully using `DatabaseFileStorageAdapter`

---

### Requirement: Env-Driven Adapter Selection

`files.module.ts` MUST bind `FILE_STORAGE_PORT` via a `useFactory` provider
that reads a `FILES_STORAGE_DRIVER` env var (`database` | `s3`) from
`filesConfig` and returns `DatabaseFileStorageAdapter` or
`S3FileStorageAdapter` accordingly. The default, when the env var is unset or
has an unrecognized value, MUST be `database` — S3 MUST NOT become active by
accident.

This selection MUST be transparent to every existing and future consumer of
`IFileStoragePort`: no command handler, query handler, or other application
code MAY change to accommodate the new adapter or the toggle.

#### Scenario: Default driver is database

- GIVEN `FILES_STORAGE_DRIVER` is unset
- WHEN the application bootstraps
- THEN `FILE_STORAGE_PORT` resolves to `DatabaseFileStorageAdapter`

#### Scenario: Explicit s3 driver selects the S3 adapter

- GIVEN `FILES_STORAGE_DRIVER=s3` and valid S3 config
- WHEN the application bootstraps
- THEN `FILE_STORAGE_PORT` resolves to `S3FileStorageAdapter`

#### Scenario: Unrecognized driver value falls back to database

- GIVEN `FILES_STORAGE_DRIVER=azure` (not a recognized value)
- WHEN the application bootstraps
- THEN `FILE_STORAGE_PORT` resolves to `DatabaseFileStorageAdapter`

#### Scenario: Callers are adapter-agnostic

- GIVEN `UploadFile`, `DeleteFile`, and `FileFindContentById` handlers depending on `IFileStoragePort`
- WHEN the bound driver changes from `database` to `s3` (or vice versa)
- THEN no handler source code changes are required for the swap to take effect

---

### Requirement: No Cross-Context or Layer Violations

`S3FileStorageAdapter` MUST live exclusively under
`files/infrastructure/adapters/` and MUST NOT be imported from
`domain/`, `application/`, or `transport/` within the `files` context. It MUST
NOT import from any other bounded context under `@contexts/*`. The
`IFileStoragePort` interface and `SaveFileContentInput` type MUST remain
unchanged by this work.

#### Scenario: No forbidden imports from the new adapter

- GIVEN the source tree under `src/contexts/files/`
- WHEN scanned for imports of `S3FileStorageAdapter` or `@aws-sdk/client-s3`
- THEN only files under `files/infrastructure/` reference them; no `domain/`, `application/`, or `transport/` file in `files` or any import from another `@contexts/<other>/` bounded context references them

---

## Out of Scope

- Migrating existing local/Postgres-stored files to S3.
- Making `s3` the default/active adapter in any environment (default stays `database`).
- Multi-cloud storage abstraction (GCS, Azure Blob, etc.).
- Changes to the `IFileStoragePort` interface or `SaveFileContentInput` type.
- Wiring any new caller (e.g. plant/planting-spot photo flows) to the port.
- LocalStack/MinIO integration-test infrastructure (mocked unit tests only for this change; deferred as explicit follow-up).
- `resolveUrl` presigned-vs-public-bucket strategy and object-key/tenant-prefixing scheme (resolved in design, not specified here as a behavioral requirement beyond "must return a locator string").
