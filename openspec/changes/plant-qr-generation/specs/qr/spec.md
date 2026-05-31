# QR Specification (new capability)

## Purpose

This spec governs the **`qr`** bounded context — persisted QR records linked 1:1 to plants. Each record stores a **frontend deep link** (`target_url`) and a **PNG image** (`png_image`). Operations are tenant-scoped by `space_id`. Scanning is handled by the frontend with existing JWT + space guards; this context does **not** expose anonymous public endpoints in MVP.

---

## ADDED Requirements

### Requirement: QrAggregate Identity and Fields

The QrAggregate MUST carry: `id` (UUID), `plantId` (UUID, unique per QR), `spaceId` (UUID, tenant), `targetUrl` (non-empty string, max 2000 chars), and `generation` (positive integer, starts at 1).

The aggregate MUST NOT hold PNG bytes — binary data lives only in infrastructure persistence.

#### Scenario: Valid QR aggregate created

- **GIVEN** a plantId, spaceId, and a valid targetUrl
- **WHEN** a QrAggregate is built and `create()` is called
- **THEN** the aggregate is valid and QrCreatedEvent is emitted

#### Scenario: Empty target URL rejected

- **GIVEN** an empty targetUrl string
- **WHEN** QrTargetUrlValueObject is constructed
- **THEN** a domain validation error is thrown

---

### Requirement: CreateQrForPlant Command

The system MUST allow creating exactly one QR per plant.

The command MUST accept `plantId` and `spaceId`. The handler MUST:

1. Assert no QR already exists for `plantId` (throw `QrAlreadyExistsForPlantException` if duplicate).
2. Build `targetUrl` as `{QR_BASE_URL}/plants/{plantId}?spaceId={spaceId}` where `QR_BASE_URL` comes from application config.
3. Generate a PNG encoding `targetUrl` via the QR PNG generator port.
4. Persist the QR row including BYTEA PNG.
5. Emit `QrCreatedEvent`.
6. Return the new `qrId`.

#### Scenario: Happy path — QR created for plant

- **GIVEN** a plantId with no existing QR in the active space
- **WHEN** CreateQrForPlant is dispatched
- **THEN** a QR row is persisted, QrCreatedEvent is emitted, and qrId is returned

#### Scenario: Duplicate QR for same plant rejected

- **GIVEN** a plantId that already has a QR
- **WHEN** CreateQrForPlant is dispatched again for the same plantId
- **THEN** QrAlreadyExistsForPlantException is thrown and HTTP 409 is returned

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

### Requirement: DeleteQrByPlantId Command

The system MUST delete the QR linked to a plant when invoked.

If no QR exists for the plant, the command MUST complete without error (idempotent).

#### Scenario: QR deleted for plant

- **GIVEN** a plant with a linked QR
- **WHEN** DeleteQrByPlantId is dispatched with that plantId
- **THEN** the QR row is removed and QrDeletedEvent is emitted

#### Scenario: No QR for plant — no-op

- **GIVEN** a plant with qr_id null and no qrs row
- **WHEN** DeleteQrByPlantId is dispatched
- **THEN** the command completes successfully with no side effects

---

### Requirement: QrFindById and QrFindByPlantId Queries

The system MUST return QrViewModel metadata (id, plantId, spaceId, targetUrl, generation, createdAt, updatedAt) scoped to the active space.

QrViewModel MUST NOT include PNG bytes.

#### Scenario: Find by id — found

- **GIVEN** a qrId in the active space
- **WHEN** QrFindById is dispatched
- **THEN** QrViewModel is returned

#### Scenario: Find by plant id — found

- **GIVEN** a plant with a linked QR in the active space
- **WHEN** QrFindByPlantId is dispatched
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
| GET | /qrs/by-plant/:plantId | QrFindByPlantId |
| POST | /qrs/:id/regenerate | RegenerateQr |

#### Scenario: Regenerate via REST

- **GIVEN** a member of the QR's space
- **WHEN** POST /api/qrs/:id/regenerate is called
- **THEN** HTTP 200 is returned and generation is incremented

---

### Requirement: GraphQL Transport for QR

The system MUST expose:

- **Queries:** `qrFindById(id: ID!): QrType`, `qrFindByPlantId(plantId: ID!): QrType`
- **Mutation:** `qrRegenerate(id: ID!): MutationResponseDto`

Resolvers MUST dispatch exclusively via QueryBus/CommandBus. GraphQL types MUST NOT expose PNG bytes.

#### Scenario: GraphQL find by plant id

- **GIVEN** a plant with linked QR
- **WHEN** qrFindByPlantId is queried with valid auth and space
- **THEN** QrType with targetUrl and generation is returned

---

### Requirement: QR Base URL Configuration

The application MUST require `QR_BASE_URL` to be set at boot.

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
- Signed tokens, QR for non-plant entities
- S3 or filesystem PNG storage
- Base64 PNG in GraphQL responses
