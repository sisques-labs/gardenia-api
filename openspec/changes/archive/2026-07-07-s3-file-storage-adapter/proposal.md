# Proposal: S3 File Storage Adapter (GDN-45)

## Intent

The `files` context already defines a vendor-agnostic storage seam — `IFileStoragePort`
(`save` / `read` / `delete` / `resolveUrl`, token `FILE_STORAGE_PORT`) — with only a
PostgreSQL adapter (`DatabaseFileStorageAdapter`, `bytea`) shipped today. Storing every
uploaded photo as a blob in Postgres bloats the DB and does not scale for real media.
GDN-45 asks for an **S3-backed adapter** so bytes can live in S3-compatible object storage,
selectable per environment **without touching domain, application, or transport**. This is
the exact swap the port was designed for.

## Scope

### In Scope
- New `S3FileStorageAdapter` in `files/infrastructure/adapters/` implementing `IFileStoragePort`
  (`save` / `read` / `delete` / `resolveUrl`), mirroring `DatabaseFileStorageAdapter` structure.
- New `@aws-sdk/client-s3` (v3 modular) dependency.
- Extend `filesConfig` with S3 env vars: bucket, region, credentials, and endpoint
  (endpoint enables MinIO/LocalStack compatibility). Credential shape follows `auth.config.ts`.
- **Env-driven adapter toggle** for `FILE_STORAGE_PORT` (e.g. `FILES_STORAGE_DRIVER=database|s3`,
  default `database`) — a NEW provider pattern in this codebase; no application-layer changes.
- Unit tests with mocked `@aws-sdk/client-s3` calls (matches `DatabaseFileStorageAdapter.spec.ts`).

### Out of Scope
- Migrating existing local/Postgres files to S3.
- Making S3 the default/active adapter in any environment (default stays `database`).
- Abstracting over multiple cloud providers.
- LocalStack/MinIO integration-test infra (no S3 testcontainer exists yet) — deferred; mocked
  unit tests satisfy AC #6 and are the recommended strategy for this change.

### AC #5 Correction
AC #5 ("existing callers keep working unchanged") is trivially true but misleading: the only
callers of the port live inside `files` (`upload`/`delete`/`find-content` handlers). No
plant/planting-spot photo flow calls this port yet (deferred per the files README). This
proposal does not preserve a live plant→files integration — it does not exist. What holds by
construction: any *future* caller is adapter-agnostic because it depends on the port.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `files`: storage backend becomes env-selectable (`database` default, `s3` optional) via a new
  runtime driver toggle. The port contract is unchanged; a new adapter and config surface are added.

## Approach

Straightforward hexagonal extension. Implement `IFileStoragePort` in `S3FileStorageAdapter`
(PutObject / GetObject / DeleteObject via `@aws-sdk/client-s3`). Add S3 config to `filesConfig`.
Replace the static `useClass` binding in `files.module.ts` with a `useFactory` that reads the
driver env var and returns the DB or S3 adapter. Domain, application, and transport are untouched.
`resolveUrl` semantics for S3 (public vs presigned) and the object-key scheme (tenant prefixing)
are deferred to design.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/contexts/files/infrastructure/adapters/s3-file-storage.adapter.ts` | New | S3 port implementation |
| `src/contexts/files/infrastructure/config/files.config.ts` | Modified | Add S3 env vars |
| `src/contexts/files/files.module.ts` | Modified | Env-driven `useFactory` toggle for `FILE_STORAGE_PORT` |
| `package.json` | Modified | Add `@aws-sdk/client-s3` |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Env-driven `useFactory` provider swap is a NEW pattern (no precedent) | Med | Explicit design decision in sdd-design; keep `database` default so misconfig is safe |
| `resolveUrl` for S3 undecided (public bucket vs presigned + TTL) | Med | Resolve in design before implementation |
| New external dependency (`@aws-sdk/client-s3`) | Low | v3 modular SDK, only `client-s3` imported |
| Mocked-only tests miss real S3 behavior | Low | Documented; LocalStack integration deferred as explicit follow-up |

## Rollback Plan

Additive and isolated. Revert the branch: removing the S3 adapter, S3 config keys, and the
`useFactory` (restore static `useClass: DatabaseFileStorageAdapter`) fully reverts. No migrations,
no data movement — the DB adapter and its data are untouched.

## Dependencies

- `@aws-sdk/client-s3` (new runtime dependency).
- Existing `IFileStoragePort` / `SaveFileContentInput` (unchanged), `filesConfig`, DI token
  `FILE_STORAGE_PORT`.

## Success Criteria

- [ ] `S3FileStorageAdapter` implements `IFileStoragePort` with no domain/application/transport changes.
- [ ] `save` / `read` / `delete` work against S3 (or S3-compatible endpoint) via `@aws-sdk/client-s3`.
- [ ] Adapter is selectable via env var; default remains `database` (S3 not active by default).
- [ ] No cross-context domain imports; only the port is implemented.
- [ ] Unit tests with mocked SDK calls pass; coverage meets threshold.
