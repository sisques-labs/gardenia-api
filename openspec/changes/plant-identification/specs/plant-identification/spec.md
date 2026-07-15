# PlantIdentification — PlantNet-powered species identification

## ADDED Requirements

### Requirement: PlantIdentificationAggregate

The system MUST define a `PlantIdentificationAggregate` carrying `id`,
`requestedByUserId`, `spaceId`, `status` (`resolved` | `no_match`),
`resolvedGbifKey` (nullable), `resolvedScientificName` (nullable),
`convertedToPlantId` (nullable), an ordered list of submitted photos
(`fileId`, `url`, `organ`, `position`), an ordered list of PlantNet
candidates (`scientificName`, `commonNames`, `score`, `rank`), `createdAt`,
`updatedAt`. Aside from `convertToPlant()`, the aggregate MUST be immutable
after creation — no field-level `update()`.

#### Scenario: A resolved identification is persisted with its full result

- GIVEN an authenticated user in a space, and 2 valid photos tagged `leaf`
  and `flower`
- WHEN they submit `IdentifyPlant` and PlantNet returns candidates whose top
  score is at or above `PLANTNET_MIN_CONFIDENCE`
- THEN a `PlantIdentificationAggregate` is persisted with `status: 'resolved'`,
  `resolvedGbifKey`/`resolvedScientificName` set from the GBIF match of the
  top candidate's name, both submitted photos, and the full candidate list

### Requirement: Identify submits all photos in one PlantNet request

`IdentifyPlantCommandHandler` MUST send every submitted photo (with its
`organ`) to PlantNet in a single `POST /v2/identify/{project}` call — never
one request per photo.

#### Scenario: Multi-photo submission produces one candidate list

- GIVEN 3 photos of the same plant tagged `leaf`, `flower`, `habit`
- WHEN `IdentifyPlant` is dispatched with all 3
- THEN exactly one call is made to the PlantNet adapter, receiving all 3
  images, and exactly one ranked candidate list is returned and persisted

### Requirement: Photo upload is delegated to the `files` context

`IdentifyPlantCommandHandler` MUST NOT implement its own byte storage or
mime/size validation. Each submitted photo MUST be uploaded via
`IFilesPort.uploadFile()` before the PlantNet call is made.

#### Scenario: An invalid photo is rejected before any PlantNet call

- GIVEN an authenticated user in a space
- WHEN they submit a photo whose mime type is not in the allowed list, or
  whose size exceeds the configured business limit
- THEN the request fails with HTTP 400 (the same domain exceptions already
  thrown inside `files`), no `PlantIdentification` record is created, and
  PlantNet is never called

### Requirement: A confident top candidate auto-resolves against GBIF

When PlantNet's top-ranked candidate has `score >= PLANTNET_MIN_CONFIDENCE`,
the handler MUST call `IPlantSpeciesPort.search()` (the existing, live,
non-persisting GBIF search) with that candidate's scientific name and, on a
match, set `resolvedGbifKey`/`resolvedScientificName` from the **GBIF**
match — not PlantNet's raw string. Nothing is written to the `plant_species`
catalog by this step.

When the top candidate's score is below the threshold, or GBIF search
returns no match for it, `resolvedGbifKey`/`resolvedScientificName` MUST
stay `null` and `status` MUST be `'no_match'`, even though PlantNet itself
returned candidates.

#### Scenario: Low-confidence top candidate stays unresolved

- GIVEN PlantNet returns candidates whose top score is `0.05`, below the
  configured `PLANTNET_MIN_CONFIDENCE` of `0.2`
- WHEN `IdentifyPlant` completes
- THEN the identification is persisted with `status: 'no_match'`,
  `resolvedGbifKey`/`resolvedScientificName` both `null`, and the full
  (unresolved) candidate list is still present for the user to see

#### Scenario: Confident candidate with no GBIF match stays unresolved

- GIVEN PlantNet's top candidate scores above the threshold, but
  `GbifSpeciesSearchQuery` returns no results for that scientific name
- WHEN `IdentifyPlant` completes
- THEN `status` is `'no_match'` and `resolved*` fields stay `null`, despite
  PlantNet's own confidence

### Requirement: Provider failures do not produce a persisted identification

If the PlantNet call itself fails — timeout, network error, or any non-2xx
other than a quota response — the handler MUST throw
`PlantIdentificationProviderUnavailableException` (502) and MUST NOT persist
a `PlantIdentificationAggregate` for that attempt. If PlantNet responds with
a quota/rate-limit error, the handler MUST throw
`PlantIdentificationQuotaExceededException` (429) instead, likewise without
persisting.

Already-uploaded photos (via `files`) are NOT rolled back on either failure.

#### Scenario: PlantNet timeout surfaces as a retryable error

- GIVEN PlantNet does not respond within the configured timeout
- WHEN `IdentifyPlant` is dispatched
- THEN `PlantIdentificationProviderUnavailableException` is thrown, HTTP 502
  is returned, and no `PlantIdentification` row exists for this attempt

#### Scenario: PlantNet quota exceeded is distinguishable from a generic failure

- GIVEN PlantNet responds with its rate-limit/quota error
- WHEN `IdentifyPlant` is dispatched
- THEN `PlantIdentificationQuotaExceededException` is thrown and HTTP 429 is
  returned

### Requirement: History is space-scoped and paginated via Criteria

`PlantIdentificationFindByCriteriaQuery` MUST return a paginated,
tenant-scoped list of `PlantIdentificationViewModel` using this context's
`Criteria` pattern (queryable-field enum + filterable-fields registry), at
minimum filterable/sortable on `status`, `requestedByUserId`, and
`createdAt`.

#### Scenario: History is tenant-isolated

- GIVEN identifications created in space X
- WHEN a request scoped to space Y queries identification history
- THEN the result is empty

### Requirement: CreatePlantFromIdentification bridges into `plants`

The system MUST expose a `CreatePlantFromIdentificationCommand` accepting
`identificationId`, `name` (required — the name the user gives the new
tracked plant), `imageUrl` (optional), and `requestingUserId`.

The handler MUST reject with `PlantIdentificationNotFoundException` (404) if
the identification doesn't exist, `PlantIdentificationForbiddenException`
(403) if `requestingUserId` isn't the identification's
`requestedByUserId`, and `PlantIdentificationNotResolvedException` (409) if
`resolvedGbifKey`/`resolvedScientificName` are `null`.

On success, the handler MUST call `IPlantsPort.createPlant()` with
`{ name, gbifSpeciesKey: resolvedGbifKey, speciesScientificName:
resolvedScientificName, imageUrl, userId: requestingUserId }` — dispatching
`plants`' own existing `CreatePlantCommand` unchanged, including its
internal `find-or-create-by-gbif-key` species linking. On success, the
identification's `convertedToPlantId` MUST be set to the new plant's id and
`PlantIdentificationConvertedToPlantEvent` MUST be emitted.

#### Scenario: Converting a resolved identification creates a linked plant

- GIVEN a `resolved` identification with `resolvedGbifKey: 2882337`,
  `resolvedScientificName: "Monstera deliciosa"`
- WHEN its owner dispatches `CreatePlantFromIdentification` with
  `name: "My Monstera"`
- THEN a new `Plant` is created via `plants`' existing `CreatePlantCommand`
  linked to that species, and the identification's `convertedToPlantId` is
  set to the new plant's id

#### Scenario: Converting an unresolved identification is rejected

- GIVEN a `no_match` identification (`resolvedGbifKey: null`)
- WHEN its owner dispatches `CreatePlantFromIdentification`
- THEN `PlantIdentificationNotResolvedException` is thrown and HTTP 409 is
  returned; no `Plant` is created

#### Scenario: A non-owner cannot convert someone else's identification

- GIVEN an identification requested by user U1
- WHEN user U2 (a member of the same space) attempts
  `CreatePlantFromIdentification` on it
- THEN the request fails with HTTP 403 and no `Plant` is created

### Requirement: PlantIdentificationOrganValueObject

The domain MUST expose `PlantIdentificationOrganValueObject` (extends
`EnumValueObject`), restricted to `leaf | flower | fruit | bark | habit |
other`. Every submitted photo MUST carry one.

#### Scenario: Invalid organ rejected

- GIVEN a photo submission with `organ: "stem"` (not in the allowed set)
- WHEN `IdentifyPlant` is dispatched
- THEN a domain validation error is thrown and no upload/PlantNet call is
  made for that request

### Requirement: REST Transport

The system MUST expose photo-based identification via REST (multipart
upload) and history/detail reads.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/plant-identifications` | Submit photos, run PlantNet identification |
| GET | `/plant-identifications` | List history (paginated, Criteria) |
| GET | `/plant-identifications/:id` | Fetch one identification |

`createPlantFromIdentification` is NOT exposed via REST — GraphQL only (no
binary payload, so REST-only upload constraint doesn't apply; kept on one
transport to avoid duplicating the conversion logic's DTOs).

#### Scenario: REST identify with valid photos

- GIVEN valid JWT + `X-Space-ID`
- WHEN POST `/plant-identifications` (multipart, 2 photos + organs)
- THEN 201 is returned with the identification result (status, resolved
  species if any, candidates, photos)

### Requirement: GraphQL Transport

The system MUST expose identification history (query) and the
plant-creation bridge (mutation) via GraphQL.

#### Scenario: GraphQL create-plant-from-identification mutation

- GIVEN valid JWT + `X-Space-ID` in GraphQL context, and a `resolved`
  identification owned by the caller
- WHEN `createPlantFromIdentification` mutation is executed with its id and
  a plant name
- THEN the new plant's `{ id }` is returned
