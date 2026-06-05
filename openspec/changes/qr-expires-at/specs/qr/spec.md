# QR Specification — Delta: Expiration Field

> Delta applied on top of `openspec/specs/qr/spec.md`. Adds `expiresAt` to QrAggregate with validation and enforcement.

---

## ADDED Requirements

### Requirement: QrAggregate Expiration Field

The QrAggregate MUST carry an optional `expiresAt` field of type `Date | null`.

- When `expiresAt` is `null`, the QR MUST never expire.
- When `expiresAt` is a `Date`, it represents the moment after which the QR is considered expired.
- `expiresAt` MUST be set only at creation time and MUST NOT be modifiable after creation.
- The `QrExpiresAtValueObject` MUST reject any provided date that is not strictly in the future at construction time (i.e. `value <= now` MUST throw a domain validation error).
- The aggregate MUST expose an `isExpired(): boolean` method that returns `true` when `expiresAt` is non-null and `expiresAt < now`.

#### Scenario: QR created without expiry

- **GIVEN** no `expiresAt` is provided to `CreateQrCommand`
- **WHEN** the aggregate is built
- **THEN** `expiresAt` is `null` and `isExpired()` returns `false`

#### Scenario: QR created with valid future expiry

- **GIVEN** an `expiresAt` date strictly in the future
- **WHEN** `QrExpiresAtValueObject` is constructed
- **THEN** the value object is valid and the aggregate stores the date

#### Scenario: Past expiry date rejected at creation

- **GIVEN** an `expiresAt` date in the past (or equal to now)
- **WHEN** `QrExpiresAtValueObject` is constructed
- **THEN** a domain validation error is thrown

---

### Requirement: CreateQr Command — Optional expiresAt

The `CreateQrCommand` MUST accept an optional `expiresAt: Date` parameter.

When provided, it MUST be passed to `QrExpiresAtValueObject` for validation before the aggregate is built.

When absent, `expiresAt` MUST be stored as `null`.

#### Scenario: QR created with expiresAt

- **GIVEN** a valid future `expiresAt` is passed to `CreateQrCommand`
- **WHEN** the command is handled
- **THEN** the QR is persisted with `expires_at` set to that value

#### Scenario: QR created without expiresAt

- **GIVEN** no `expiresAt` is passed to `CreateQrCommand`
- **WHEN** the command is handled
- **THEN** the QR is persisted with `expires_at = NULL`

---

### Requirement: Expiry Enforcement on Queries

The system MUST enforce QR expiry on all read operations that return QR data to callers.

`QrFindByIdQueryHandler` and `QrFindPngByIdQueryHandler` MUST:

1. Confirm the QR exists (via `AssertQrViewModelExistsService`).
2. Assert the QR has not expired (via `AssertQrNotExpiredService`).
3. Return the result only if both assertions pass.

If the QR is expired, `QrExpiredError` MUST be thrown and propagated as HTTP 410 Gone on REST endpoints and as a domain error on GraphQL.

`RegenerateQrCommand` is exempt from expiry enforcement — regenerating an expired QR is a valid administrative action.

#### Scenario: Expired QR returns 410

- **GIVEN** a QR whose `expiresAt` is in the past
- **WHEN** `GET /api/qrs/:id` is called
- **THEN** HTTP 410 Gone is returned

#### Scenario: Expired QR PNG returns 410

- **GIVEN** a QR whose `expiresAt` is in the past
- **WHEN** `GET /api/qrs/:id/image` is called
- **THEN** HTTP 410 Gone is returned

#### Scenario: Non-expired QR with expiresAt succeeds

- **GIVEN** a QR with a future `expiresAt`
- **WHEN** `GET /api/qrs/:id` is called
- **THEN** HTTP 200 is returned with `expiresAt` in the response body

---

### Requirement: QrViewModel and DTOs expose expiresAt

`QrViewModel`, `QrRestResponseDto`, and `QrResponseDto` (GraphQL) MUST include `expiresAt: Date | null`.

The field MUST be present in all QR read responses regardless of whether it is null.

---

## MODIFIED Requirements

### Requirement: QrAggregate Identity and Fields (updated)

The QrAggregate MUST carry: `id` (UUID), `spaceId` (UUID, tenant), `targetUrl` (non-empty string, max 2000 chars), `generation` (positive integer, starts at 1), and `expiresAt` (`Date | null`).

Replaces the original field list in `openspec/specs/qr/spec.md`.

---

## Non-Functional Requirements (additions)

- `expires_at` column MUST be nullable (`TIMESTAMPTZ NULL`) in the `qrs` table.
- Existing QRs MUST have `expires_at = NULL` after migration (never expire by default).
- `QrExpiredError` MUST be registered in `BaseExceptionFilter` mapping to HTTP 410.
