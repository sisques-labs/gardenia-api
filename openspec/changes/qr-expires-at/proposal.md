# Proposal: QR Expiration Field (`qr` bounded context)

## Why

QR codes printed on physical labels may need to be deactivated after a specific date — for example, to enforce time-limited access, seasonal promotions, or retired plant batches. Currently the `qr` context has no concept of expiry, so any QR remains permanently valid once created.

Adding `expiresAt` allows callers to create time-limited QRs without external bookkeeping. Enforcement at the domain level guarantees that expired QRs are rejected consistently across all transport surfaces (REST and GraphQL).

## What Changes

- Add optional `expiresAt` field to `QrAggregate`: `null` means the QR never expires; a future date means the QR expires on that date.
- `expiresAt` is set only at creation time (`CreateQrCommand`) — it is immutable after creation.
- New `QrExpiresAtValueObject` that wraps `Date | null` and validates that, when provided, the date is strictly in the future.
- New domain error `QrExpiredError` (HTTP 410 Gone) thrown when any query handler (`QrFindByIdQuery`, `QrFindPngByIdQuery`) detects the QR has expired.
- Database migration adding nullable `expires_at` column to `qrs` table.
- `expiresAt` exposed in all read responses (REST + GraphQL) as a nullable date field.

**Not in scope:**

- Updating `expiresAt` after creation (would require a separate `UpdateQrExpiresAt` command).
- Automatic deletion of expired QRs (no background job or soft-delete).
- Expiry enforcement on `RegenerateQrCommand` (regeneration of an expired QR is allowed — enforcement is a read concern).
- Backfill for existing QRs (null = never expires, safe default).

## Capabilities

### Modified Capabilities

- `qr`: `CreateQr` now accepts an optional `expiresAt`; `QrFindById` and `QrFindPngById` enforce expiry; all read models and DTOs expose `expiresAt`.

## Impact

### Bounded contexts

| Context | Impact |
|---------|--------|
| **qr** | Domain VO, aggregate, error, command, queries, entity, mapper, migration, DTOs, transport |
| **plants** | No change — `plants` uses QR metadata via read models; new `expiresAt` field is passed through transparently |

### APIs (changed)

| Method | Path | Change |
|--------|------|--------|
| POST | `/api/plants` | QR created with optional `expiresAt` (passed via `CreateQrCommand`) |
| GET | `/api/qrs/:id` | Response includes `expiresAt`; returns 410 if expired |
| GET | `/api/qrs/:id/image` | Returns 410 if expired |
| GraphQL | `qrFindById` | Returns `expiresAt`; error if expired |

### Rollback plan

1. Revert code changes.
2. Run down-migration: drop `expires_at` column from `qrs` (no data loss on other columns).
3. No impact on existing QRs — `expires_at` was nullable, default `NULL`.

## Success Criteria

- [ ] A QR created with `expiresAt` in the past is immediately rejected at value object level.
- [ ] A QR created with `expiresAt: null` never expires and all queries succeed.
- [ ] A QR created with a valid future `expiresAt`, after that date passes, returns 410 Gone on `GET /api/qrs/:id` and `GET /api/qrs/:id/image`.
- [ ] `expiresAt` is present (null or date) in all QR REST and GraphQL read responses.
- [ ] Down-migration cleanly removes `expires_at`; up-migration safely adds it with `NULL` for existing rows.
