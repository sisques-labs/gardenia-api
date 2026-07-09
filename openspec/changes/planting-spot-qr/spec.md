# Spec: Planting Spot QR Code

**Source change:** planting-spot-qr
**Modifies capability:** planting-spots

---

## Requirements

### Requirement: QR Auto-Created on Planting Spot Creation

Every `PlantingSpot` created via `CreatePlantingSpotCommand` MUST be linked to
a newly created QR whose `targetUrl` deep-links to that spot's detail page.
The command MUST NOT accept `qrId` as client input — it is generated
internally by the handler.

#### Scenario: Creating a spot generates a linked QR

- GIVEN a valid `CreatePlantingSpotCommand`
- WHEN the command is dispatched
- THEN a QR is created via `IPlantingSpotQrPort.createForPlantingSpot` with
  `targetUrl = {QR_BASE_URL}/planting-spots/{spotId}?spaceId={spaceId}`, and
  the resulting `qrId` is persisted on the new `PlantingSpotAggregate`

---

### Requirement: qr_id Persistence and Cascade Delete

The `planting_spots` table MUST gain a nullable, unique `qr_id` column with a
foreign key to `qrs(id)` (`ON DELETE SET NULL`). Deleting a planting spot
MUST delete its linked QR row via a `BEFORE DELETE` trigger, mirroring the
`plants` ↔ `qrs` link.

#### Scenario: Deleting a spot deletes its QR

- GIVEN a planting spot with a linked QR
- WHEN the planting spot row is deleted
- THEN the linked `qrs` row is also deleted by the
  `delete_qr_when_planting_spot_deleted` trigger

#### Scenario: Existing spots are unaffected by the migration

- GIVEN a planting spot row created before this migration
- WHEN the migration is applied
- THEN the row's `qr_id` reads `NULL` and all existing behavior is unchanged

---

### Requirement: QR Resolved as a GraphQL Field

`PlantingSpotResponseDto` MUST expose a `qr` resolved field (`id`, `image`,
`targetUrl`, `generation`, timestamps) via
`PlantingSpotQrResolvedFieldResolver`, returning `null` when the spot has no
`qrId` or when the linked QR cannot be found.

#### Scenario: QR resolves when present

- GIVEN a planting spot with a `qrId` pointing to an existing QR
- WHEN the `qr` field is resolved on `plantingSpotFindById`
- THEN the response includes the QR's `id`, `image` (base64 PNG),
  `targetUrl`, and `generation`

#### Scenario: QR is null when unset

- GIVEN a planting spot with no `qrId`
- WHEN the `qr` field is resolved
- THEN it returns `null` without calling the QR port

#### Scenario: QR is null when deleted independently

- GIVEN a planting spot whose `qrId` no longer resolves to a QR row
- WHEN the `qr` field is resolved
- THEN it returns `null`

---

### Requirement: REST Exposes qrId Only

`PlantingSpotRestResponseDto` MUST expose `qrId` (nullable) but MUST NOT
include the QR image or target URL — those are only resolvable via the
GraphQL `qr` field, matching the existing `plants` REST pattern.

#### Scenario: REST response includes qrId

- GIVEN a planting spot with a linked QR
- WHEN `GET /planting-spots/:id` is called
- THEN the response includes `qrId` but no QR image data

---

### Requirement: No New MCP Surface

Planting spot MCP tools MUST NOT gain QR-specific actions in this change —
`plants` doesn't expose QR regeneration/deletion at the MCP layer either, so
none is added here.

#### Scenario: MCP tool set is unchanged

- GIVEN the planting-spots MCP tool registry before and after this change
- WHEN the tool list is compared
- THEN no QR-related tool has been added
