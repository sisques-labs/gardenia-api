# QR Specification (new capability)

## Purpose

This spec governs the **`qr`** bounded context — persisted QR records that encode arbitrary **frontend deep links** (`target_url`) plus a **PNG image** (`png_image`). QRs are **not** tied to plants in this context; consumers (e.g. `plants`) link via their own `qr_id` field. Operations are tenant-scoped by `space_id`. Scanning is handled by the frontend with existing JWT + space guards; this context does **not** expose anonymous public endpoints in MVP.

---

## ADDED Requirements

### Requirement: QrAggregate Identity and Fields

The QrAggregate MUST carry: `id` (UUID), `spaceId` (UUID, tenant), `targetUrl` (non-empty string, max 2000 chars), and `generation` (positive integer, starts at 1).

The aggregate MUST NOT reference `plantId` or any other consumer entity.

The aggregate MUST NOT hold PNG bytes — binary data lives only in infrastructure persistence.

#### Scenario: Valid QR aggregate created

- **GIVEN** a spaceId and a valid targetUrl
- **WHEN** a QrAggregate is built and `create()` is called
- **THEN** the aggregate is valid and QrCreatedEvent is emitted

#### Scenario: Empty target URL rejected

- **GIVEN** an empty targetUrl string
- **WHEN** QrTargetUrlValueObject is constructed
- **THEN** a domain validation error is thrown

---

### Requirement: CreateQr Command

The system MUST allow creating a QR when given a caller-supplied `targetUrl` and `spaceId`.

The handler MUST:

1. Generate a PNG encoding `targetUrl` via the QR PNG generator port.
2. Persist the QR row including BYTEA PNG.
3. Emit `QrCreatedEvent`.
4. Return the new `qrId`.

The `qr` context MUST NOT build plant-specific URLs; callers (e.g. `plants`) supply `targetUrl`.

#### Scenario: Happy path — QR created

- **GIVEN** a valid targetUrl and spaceId
- **WHEN** CreateQr is dispatched
- **THEN** a QR row is persisted, QrCreatedEvent is emitted, and qrId is returned

---

### Requirement: RegenerateQr Command

The system MUST allow regenerating the PNG for an existing QR without changing `id` or `target_url`.

The handler MUST:

1. Load the QR scoped to the active space.
2. Generate a new PNG for the existing `target_url`.
3. Replace `png_image` in persistence.
4. Increment `generation` by 1 on the aggregate.
5. Emit `QrRegeneratedEvent`.

#### Scenario: Happy path — PNG regenerated

- **GIVEN** an existing QR with generation N
- **WHEN** RegenerateQr is dispatched for that qrId
- **THEN** png_image is updated, generation is N+1, target_url is unchanged, and QrRegeneratedEvent is emitted

#### Scenario: QR not found

- **GIVEN** a qrId that does not exist in the active space
- **WHEN** RegenerateQr is dispatched
- **THEN** QrNotFoundException is thrown and HTTP 404 is returned

---

### Requirement: DeleteQr Command

The system MUST delete a QR by `qrId` when invoked.

If the QR does not exist, the command MUST complete without error (idempotent).

#### Scenario: QR deleted by id

- **GIVEN** an existing qrId in the active space
- **WHEN** DeleteQr is dispatched with that qrId
- **THEN** the QR row is removed and QrDeletedEvent is emitted

#### Scenario: Missing QR — no-op

- **GIVEN** a qrId that does not exist
- **WHEN** DeleteQr is dispatched
- **THEN** the command completes successfully with no side effects

---

### Requirement: QrFindById Query

The system MUST return QrViewModel metadata (id, spaceId, targetUrl, generation, createdAt, updatedAt) scoped to the active space.

QrViewModel MUST NOT include PNG bytes or plant references.

#### Scenario: Find by id — found

- **GIVEN** a qrId in the active space
- **WHEN** QrFindById is dispatched
- **THEN** QrViewModel is returned

#### Scenario: Cross-space QR invisible

- **GIVEN** a qrId that exists in space A
- **WHEN** QrFindById is dispatched with space B active
- **THEN** QrNotFoundException is thrown

---

### Requirement: Qr PNG Download

The system MUST expose an authenticated endpoint to download the PNG bytes.

`GET /api/qrs/:id/image` MUST return `Content-Type: image/png` for a QR in the active space.

#### Scenario: PNG downloaded

- **GIVEN** a qrId in the active space with stored png_image
- **WHEN** GET /api/qrs/:id/image is called with valid JWT and X-Space-ID
- **THEN** HTTP 200 is returned with image/png body

#### Scenario: Unauthenticated download rejected

- **GIVEN** a valid qrId
- **WHEN** GET /api/qrs/:id/image is called without JWT
- **THEN** HTTP 401 is returned

---

### Requirement: REST Transport for QR

The system MUST expose the following REST endpoints, all guarded by JwtAuthGuard and SpaceGuard (no @SkipSpace):

| Method | Path | Handler |
|--------|------|---------|
| GET | /qrs/:id | QrFindById |
| GET | /qrs/:id/image | Qr PNG download |
| POST | /qrs/:id/regenerate | RegenerateQr |

Lookup by plant is **not** exposed in the `qr` context; use `PlantFindById` (plants owns `qr_id`).

#### Scenario: Regenerate via REST

- **GIVEN** a member of the QR's space
- **WHEN** POST /api/qrs/:id/regenerate is called
- **THEN** HTTP 200 is returned and generation is incremented

---

### Requirement: GraphQL Transport for QR

The system MUST expose:

- **Query:** `qrFindById(id: ID!): QrType`
- **Mutation:** `qrRegenerate(id: ID!): MutationResponseDto`

Resolvers MUST dispatch exclusively via QueryBus/CommandBus. GraphQL types MUST NOT expose PNG bytes or plantId.

---

### Requirement: QR Base URL Configuration

`QR_BASE_URL` is required at application boot for **consumers** that build deep links (e.g. `plants`). The `qr` bounded context does not read plant routes from config when creating a QR — it only persists the `targetUrl` provided by the caller.

If `QR_BASE_URL` is missing, the application MUST fail to start with a clear configuration error.

#### Scenario: Missing config prevents boot

- **GIVEN** QR_BASE_URL is not set in environment
- **WHEN** the application starts
- **THEN** startup fails with a configuration error

---

## Non-Functional Requirements

- All QR REST and GraphQL endpoints MUST require valid JWT and active space membership.
- Read and write repositories MUST use `createTenantRepository` scoped by `space_id`.
- Unit tests MUST cover aggregate, handlers, mappers, and PNG generator adapter (mocked).
- Integration tests MUST cover persistence and tenant boundary for `qrs` table.

---

## Out of Scope

- Public/anonymous QR resolution API
- `plantId` (or other entity ids) on `qrs` table or QrAggregate
- S3 or filesystem PNG storage
- Base64 PNG in GraphQL responses
