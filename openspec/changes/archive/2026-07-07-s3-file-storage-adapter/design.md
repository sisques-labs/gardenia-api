# Design: S3 File Storage Adapter (GDN-45)

## Technical Approach

Purely additive hexagonal extension of the `files` context. We add a **second**
implementation of the existing `IFileStoragePort` (`save`/`read`/`delete`/`resolveUrl`,
token `FILE_STORAGE_PORT`) that persists bytes in S3-compatible object storage, and we
replace the static `useClass: DatabaseFileStorageAdapter` binding with an **env-driven
`useFactory`** that selects the DB or S3 adapter at DI time. Domain, application, and
transport layers are untouched — they keep depending on the port only.

The S3 adapter mirrors `DatabaseFileStorageAdapter` one-to-one in shape: same three
constructor dependencies pattern (external client, `SpaceContext`, `filesConfig`), same
`Logger`, same method contracts. The single meaningful difference is the byte backend:
`@aws-sdk/client-s3` v3 (`PutObject` / `GetObject` / `DeleteObject`) instead of a TypeORM
`bytea` repository.

Three sub-problems drive the design, each resolved below with justification:
1. `resolveUrl` semantics (the port method is **synchronous** — this is decisive).
2. Object-key scheme and how tenant isolation is preserved without a tenant proxy.
3. S3 SDK error → contract mapping (what returns `null`, what propagates).

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|-----------------------|-----------|
| Adapter selection | `useFactory` on `FILE_STORAGE_PORT`, driver read from typed `filesConfig.storageDriver` | Static `useClass` chosen from `process.env` at module-eval time | Factory is typed, validated by the config layer, and overridable in tests via config. Reading `process.env` at module eval bypasses `ConfigModule` and is untestable |
| `S3Client` lifecycle | Dedicated singleton provider (`S3_CLIENT` token) built once via `useFactory` from `filesConfig` | `new S3Client()` inside the adapter constructor | Client built once (connection pool reuse), and the token is trivially mockable in unit tests. Constructor stays hydration-only per architecture rule #1 |
| `resolveUrl` for S3 | Return the app's own download endpoint `${publicBaseUrl}/api/files/${key}/content` — **identical to the DB adapter** | Presigned URL (`getSignedUrl` + TTL); public bucket URL | (1) The port method is **sync**; `getSignedUrl` is **async** → cannot fit without changing the port (out of scope). (2) A presigned/public URL bypasses `JwtAuthGuard`+`SpaceGuard` tenant isolation → security regression. Proxying bytes through the authenticated endpoint keeps the bucket **private** and the URL contract backend-agnostic |
| Object-key scheme | `${spaceId}/${fileId}` (space-prefixed) | Flat `${fileId}` key | Flat keys risk cross-space collision and lose tenant namespacing. Prefixing by space mirrors the DB adapter's `createTenantRepository` isolation on a flat bucket |
| Tenant scope on read/delete | Derive `spaceId` from injected `SpaceContext` (`require()`); on save use `input.spaceId` | Add `spaceId` to `read`/`delete` signatures | Port signatures are frozen (`read(key)`, `delete(key)`). `SpaceContext` already carries the request's active space — exactly how the DB adapter scopes today |
| `read` on missing object | Catch `NoSuchKey` / HTTP 404 → return `null` | Throw `FileNotFoundException` | Port contract is `read → Buffer \| null`. DB adapter returns `null` on miss; the 404 is raised upstream by the query handler / assert service, never by the adapter |
| `delete` on missing object | No special handling (idempotent) | Existence pre-check | `DeleteObject` is idempotent in S3 and does not throw on absent keys — matches the DB adapter's idempotent `repository.delete` |
| `save`/other S3 faults | Log + rethrow the raw SDK error (surfaces as 500) | Wrap in a `files` domain exception | `AccessDenied`, network, missing-bucket are **infra** faults, not client 4xx. No existing domain exception fits, and inventing one would mislabel a 500 as a client error |
| Credentials | Optional in config; passed to `S3Client` only when both provided, else fall back to the SDK default credential chain | Hard-require `accessKeyId`/`secretAccessKey` | Production commonly uses IAM roles / instance profiles — hard-requiring static keys breaks that. Only `bucket` is mandatory when driver is `s3` |
| Endpoint / path-style | Configurable `endpoint` + `forcePathStyle` | AWS-only | Enables MinIO/LocalStack compatibility (endpoint override + path-style addressing) for future integration testing without changing the adapter |
| SDK footprint | `@aws-sdk/client-s3` only (latest stable v3), no `s3-request-presigner` | Full `aws-sdk` v2 monolith; add presigner now | v3 modular client keeps the bundle small; presigner is unnecessary because we proxy bytes (no signed URLs). Presigning becomes a follow-up only if a 302-redirect download is ever adopted |

## Data Flow

The port contract is unchanged, so the upload/download/delete flows from the
`files-module` design are identical — only the adapter internals differ.

```
SAVE  (upload handler → port.save)
  input { key=fileId, bytes, mimeType, spaceId }
    └─ objectKey = `${spaceId}/${fileId}`
         └─ S3Client.send(PutObjectCommand{ Bucket, Key: objectKey,
                                            Body: bytes, ContentType: mimeType })

READ  (download / find-content handler → port.read)
  read(key=fileId)
    └─ objectKey = `${spaceContext.require()}/${fileId}`
         └─ S3Client.send(GetObjectCommand{ Bucket, Key: objectKey })
              ├─ ok      → Buffer.from(await Body.transformToByteArray())
              └─ NoSuchKey / 404 → return null   (contract: Buffer | null)

DELETE  (delete handler → port.delete)
  delete(key=fileId)
    └─ objectKey = `${spaceContext.require()}/${fileId}`
         └─ S3Client.send(DeleteObjectCommand{ Bucket, Key: objectKey })   // idempotent

RESOLVE URL  (upload handler → port.resolveUrl, SYNC)
  resolveUrl(key=fileId)  →  `${config.publicBaseUrl}/api/files/${fileId}/content`
    // App streams bytes via read(); bucket stays private. Identical to DB adapter.
```

### DI selection (module init)

```
FILE_STORAGE_PORT provider (useFactory, request-scoped via SpaceContext — same as today)
  reads filesConfig.storageDriver
    ├─ 's3'       → new S3FileStorageAdapter(s3Client, spaceContext, config)
    └─ 'database' → new DatabaseFileStorageAdapter(contentRepo, spaceContext, config)   // default
```

Note: the current `useClass: DatabaseFileStorageAdapter` already injects `SpaceContext`
(request-scoped), so `FILE_STORAGE_PORT` is **already** request-scoped today. The factory
inheriting that scope is status quo, not a regression. `S3Client` is a **singleton** built
once at module init; only the lightweight adapter instance is created per request.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/files/infrastructure/adapters/s3-file-storage.adapter.ts` | Create | `S3FileStorageAdapter implements IFileStoragePort` over `@aws-sdk/client-s3` v3 |
| `src/contexts/files/infrastructure/adapters/s3-file-storage.adapter.spec.ts` | Create | Unit tests, mocked `S3Client.send`, `jest.Mocked` style, no `@nestjs/testing` |
| `src/contexts/files/infrastructure/config/s3-client.provider.ts` | Create | Exports `S3_CLIENT` token + `s3ClientProvider` (singleton `useFactory` from `filesConfig`) |
| `src/contexts/files/infrastructure/config/files.config.ts` | Modify | Add `storageDriver` + nested `s3` config with validation |
| `src/contexts/files/files.module.ts` | Modify | Add `s3ClientProvider`; replace static `FILE_STORAGE_PORT` binding with `useFactory` toggle |
| `package.json` | Modify | Add `@aws-sdk/client-s3` (latest stable v3) |
| `src/contexts/files/README.md` | Modify | Document the env-selectable storage backend + S3 env vars |

## Interfaces / Contracts

### Config additions — `files.config.ts`

```ts
export type FilesStorageDriver = 'database' | 's3';
export const DEFAULT_FILES_STORAGE_DRIVER: FilesStorageDriver = 'database';
export const DEFAULT_FILES_S3_REGION = 'us-east-1';

export const filesConfig = registerAs('files', () => {
  // ...existing maxSizeBytes / allowedMimeTypes / publicBaseUrl...

  const rawDriver = (process.env.FILES_STORAGE_DRIVER ?? '').toLowerCase();
  const storageDriver: FilesStorageDriver =
    rawDriver === 's3' ? 's3' : DEFAULT_FILES_STORAGE_DRIVER; // safe fallback to 'database'

  const s3 = {
    bucket: process.env.FILES_S3_BUCKET ?? '',
    region: process.env.FILES_S3_REGION ?? DEFAULT_FILES_S3_REGION,
    endpoint: process.env.FILES_S3_ENDPOINT || undefined,        // MinIO/LocalStack
    forcePathStyle: process.env.FILES_S3_FORCE_PATH_STYLE === 'true',
    accessKeyId: process.env.FILES_S3_ACCESS_KEY_ID || undefined,
    secretAccessKey: process.env.FILES_S3_SECRET_ACCESS_KEY || undefined,
    keyPrefix: (process.env.FILES_S3_KEY_PREFIX ?? '').replace(/^\/+|\/+$/g, ''),
  };

  // Fail fast on misconfiguration: s3 driver requires a bucket.
  if (storageDriver === 's3' && !s3.bucket) {
    throw new Error(
      'FILES_STORAGE_DRIVER=s3 requires FILES_S3_BUCKET to be set',
    );
  }

  return { maxSizeBytes, allowedMimeTypes, publicBaseUrl, storageDriver, s3 };
});
export type FilesConfig = ConfigType<typeof filesConfig>;
```

Env var summary (all optional unless driver is `s3`):

| Env var | Type | Default | Notes |
|---------|------|---------|-------|
| `FILES_STORAGE_DRIVER` | `database`\|`s3` | `database` | Unknown value → `database` (safe) |
| `FILES_S3_BUCKET` | string | — | **Required when driver=`s3`** |
| `FILES_S3_REGION` | string | `us-east-1` | |
| `FILES_S3_ENDPOINT` | string | unset | MinIO/LocalStack override |
| `FILES_S3_FORCE_PATH_STYLE` | boolean | `false` | `true` for MinIO |
| `FILES_S3_ACCESS_KEY_ID` | string | unset | Omit to use SDK default credential chain (IAM role) |
| `FILES_S3_SECRET_ACCESS_KEY` | string | unset | Omit to use SDK default credential chain |
| `FILES_S3_KEY_PREFIX` | string | `''` | Optional base folder prepended to keys |

### S3 client provider — `s3-client.provider.ts`

```ts
export const S3_CLIENT = Symbol('S3_CLIENT');

export const s3ClientProvider: Provider = {
  provide: S3_CLIENT,
  inject: [filesConfig.KEY],
  useFactory: (config: FilesConfig): S3Client =>
    new S3Client({
      region: config.s3.region,
      ...(config.s3.endpoint ? { endpoint: config.s3.endpoint } : {}),
      forcePathStyle: config.s3.forcePathStyle,
      ...(config.s3.accessKeyId && config.s3.secretAccessKey
        ? {
            credentials: {
              accessKeyId: config.s3.accessKeyId,
              secretAccessKey: config.s3.secretAccessKey,
            },
          }
        : {}), // else: SDK default credential provider chain
    }),
};
```

### The `FILE_STORAGE_PORT` factory — `files.module.ts` (riskiest part)

```ts
import { getRepositoryToken } from '@nestjs/typeorm';
import { S3Client } from '@aws-sdk/client-s3';
// ...

const fileStoragePortProvider = {
  provide: FILE_STORAGE_PORT,
  inject: [
    filesConfig.KEY,                                 // FilesConfig (carries storageDriver)
    getRepositoryToken(FileContentTypeOrmEntity),    // DB adapter dep
    SpaceContext,                                    // shared tenant scope
    S3_CLIENT,                                       // S3 adapter dep (singleton)
  ],
  useFactory: (
    config: FilesConfig,
    contentRepo: Repository<FileContentTypeOrmEntity>,
    spaceContext: SpaceContext,
    s3Client: S3Client,
  ): IFileStoragePort =>
    config.storageDriver === 's3'
      ? new S3FileStorageAdapter(s3Client, spaceContext, config)
      : new DatabaseFileStorageAdapter(contentRepo, spaceContext, config),
};
```

The factory injects the union of **both** adapters' dependencies and instantiates only the
selected one. `S3_CLIENT` is always constructed (cheap singleton) even when driver is
`database`; it opens no connection until `send()` is called, so the idle cost is nil.
`DatabaseFileStorageAdapter` and `S3FileStorageAdapter` are registered as `providers` too
(so Nest can resolve them if ever injected directly), and `s3ClientProvider` is added to the
providers array. Both adapters are removed from any `useClass` binding — selection is the
factory's sole responsibility.

### The adapter — `s3-file-storage.adapter.ts`

```ts
@Injectable()
export class S3FileStorageAdapter implements IFileStoragePort {
  private readonly logger = new Logger(S3FileStorageAdapter.name);

  constructor(
    @Inject(S3_CLIENT) private readonly s3: S3Client,
    private readonly spaceContext: SpaceContext,
    @Inject(filesConfig.KEY) private readonly config: FilesConfig,
  ) {}

  async save(input: SaveFileContentInput): Promise<void> {
    const Key = this.buildKey(input.spaceId, input.key);
    this.logger.log(`Storing ${input.bytes.length} bytes at s3://${this.config.s3.bucket}/${Key}`);
    await this.s3.send(new PutObjectCommand({
      Bucket: this.config.s3.bucket,
      Key,
      Body: input.bytes,
      ContentType: input.mimeType,
    }));
    this.logger.debug(`Bytes stored for file ${input.key}`);
  }

  async read(key: string): Promise<Buffer | null> {
    const Key = this.buildKey(this.spaceContext.require(), key);
    this.logger.log(`Reading bytes for file ${key}`);
    try {
      const res = await this.s3.send(new GetObjectCommand({ Bucket: this.config.s3.bucket, Key }));
      if (!res.Body) return null;
      return Buffer.from(await res.Body.transformToByteArray());
    } catch (err) {
      if (this.isNotFound(err)) {
        this.logger.warn(`No bytes found for file ${key}`);
        return null;
      }
      throw err; // AccessDenied / network / misconfig → surfaces as 500
    }
  }

  async delete(key: string): Promise<void> {
    const Key = this.buildKey(this.spaceContext.require(), key);
    this.logger.log(`Deleting bytes for file ${key}`);
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.config.s3.bucket, Key })); // idempotent
  }

  resolveUrl(key: string): string {
    return `${this.config.publicBaseUrl}/api/files/${key}/content`;
  }

  private buildKey(spaceId: string, fileId: string): string {
    const prefix = this.config.s3.keyPrefix ? `${this.config.s3.keyPrefix}/` : '';
    return `${prefix}${spaceId}/${fileId}`;
  }

  private isNotFound(err: unknown): boolean {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    return e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404;
  }
}
```

`res.Body.transformToByteArray()` is the SDK v3 Node stream helper — the whole object is
buffered into memory, consistent with the current in-memory upload/download model
(`FileInterceptor` memory storage, `bytea` round-trip). Streaming large media is a future
optimization, not part of this change.

## Open Questions — Resolved

1. **`resolveUrl` semantics** → **App-proxied download endpoint, NOT presigned/public URL.**
   Decisive constraint: `resolveUrl(key): string` is **synchronous**, and AWS SDK v3
   presigning (`getSignedUrl`) is **asynchronous** — it cannot fit the frozen port
   signature. Beyond that, presigned/public URLs would bypass `JwtAuthGuard`+`SpaceGuard`,
   breaking tenant isolation. Returning `${publicBaseUrl}/api/files/${key}/content` (identical
   to the DB adapter) keeps the bucket **private**, the URL contract uniform across backends,
   and access authenticated. A future 302-redirect-to-signed-URL download would require an
   async port change and is deferred.

2. **Object-key scheme** → **`{keyPrefix?}/{spaceId}/{fileId}`, space-prefixed.**
   `SaveFileContentInput` carries `spaceId`; on `save` we use it directly. On `read`/`delete`
   (which only receive `key`) we derive `spaceId` from the injected `SpaceContext.require()`,
   exactly how the DB adapter scopes via `createTenantRepository`. Space-prefixing prevents
   cross-space key collisions and preserves tenant isolation on a flat bucket. Optional
   `FILES_S3_KEY_PREFIX` allows a shared-bucket base folder.

3. **Error mapping** → **Reuse ZERO domain exceptions inside the adapter.**
   - `read` + `NoSuchKey`/404 → return `null` (satisfies the `Buffer | null` contract; the
     404 is raised upstream by the query handler / `AssertFileViewModelExistsService`, never
     the adapter — mirroring the DB adapter, which also never throws `FileNotFoundException`).
   - `delete` on a missing key → no-op (S3 `DeleteObject` is idempotent).
   - `save` / any other fault (`AccessDenied`, network, missing bucket) → log + rethrow the
     raw SDK error, surfacing as a 500. These are infra faults, not client 4xx; wrapping them
     in a `files` domain exception (`FileNotFound`/`FileTooLarge`/`UnsupportedFileType`) would
     mislabel their semantics. No new exception type is introduced.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `S3FileStorageAdapter`: `save` sends `PutObjectCommand` with `Bucket`/`Key=${spaceId}/${fileId}`/`Body`/`ContentType`; `read` ok → returns Buffer from `transformToByteArray`; `read` `NoSuchKey` → `null`; `read` other error → rethrows; `delete` sends `DeleteObjectCommand` and is idempotent; `resolveUrl` app-relative + `publicBaseUrl` variants; `buildKey` applies `keyPrefix` | Jest, `jest.Mocked` — `const s3 = { send: jest.fn() } as unknown as jest.Mocked<S3Client>`; `SpaceContext` stubbed with `require: () => SPACE_ID`; no `@nestjs/testing`. Inspect `s3.send.mock.calls[0][0].input` for command params. Mirrors `database-file-storage.adapter.spec.ts` |
| Unit (config) | `filesConfig`: `storageDriver` defaults to `database`; unknown value → `database`; `s3`+missing bucket → throws; env parsing for `endpoint`/`forcePathStyle`/`keyPrefix`/credentials | Jest — set `process.env`, call the `registerAs` factory |
| Integration | **Deferred** (explicit out-of-scope). No LocalStack/MinIO testcontainer exists yet; mocked unit tests satisfy AC #6. Follow-up: `endpoint`+`forcePathStyle` already make the adapter LocalStack-ready | — |
| Static | Existing `files-no-cross-context-import` scan still passes (adapter imports only `@contexts/files/*` + AWS SDK) | Jest source scan |

Mocking pattern (no real network, no SDK client mock library needed):

```ts
const s3 = { send: jest.fn() } as unknown as jest.Mocked<S3Client>;
// read hit:
s3.send.mockResolvedValueOnce({ Body: { transformToByteArray: async () => new Uint8Array([1,2,3]) } } as any);
// read miss:
s3.send.mockRejectedValueOnce(Object.assign(new Error('missing'), { name: 'NoSuchKey' }));
```

## Migration / Rollout

Additive and isolated — no DB migration, no data movement. Default `storageDriver` stays
`database`, so existing environments behave identically with zero config change. Enabling S3
is per-environment: set `FILES_STORAGE_DRIVER=s3` + `FILES_S3_BUCKET` (+ credentials/endpoint
as needed). Rollback = revert the branch (remove adapter, S3 config keys, `s3ClientProvider`,
and restore the static `useClass: DatabaseFileStorageAdapter` binding). The DB adapter and its
`file_contents` data are never touched.
