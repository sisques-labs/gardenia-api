# PlantPhotos — Upload & History

## ADDED Requirements

### Requirement: PlantPhotoAggregate

The system MUST define a `PlantPhotoAggregate` carrying `id`, `plantId`, `fileId`, `url`, `userId`, `spaceId`, `createdAt`, `updatedAt`. The aggregate MUST be immutable after creation (no `update()` method) — only `create()` and `delete()`.

#### Scenario: Two photos uploaded for the same plant are both persisted

- GIVEN a plant with no photos
- WHEN a user uploads photo A and then, later, photo B
- THEN both `PlantPhotoAggregate` records exist, each with its own `id` and its own `createdAt` timestamp reflecting when it was uploaded

### Requirement: Upload orchestrates the existing `files` context

`UploadPlantPhotoCommandHandler` MUST NOT implement its own byte storage or mime/size validation. It MUST delegate entirely to the `files` bounded context via `IFilesPort.uploadFile()`, and persist only the association (`plantId`, the returned `fileId`, the returned `url`).

#### Scenario: Uploading a valid image succeeds

- GIVEN an authenticated user in a space, and an existing `plantId`
- WHEN they POST a valid image (allowed mime type, within the configured size limit) with that `plantId`
- THEN a `File` is created in the `files` context, a `PlantPhoto` record is created referencing it, and the response includes `{ id, plantId, fileId, url, createdAt }` with HTTP 201

#### Scenario: Uploading an invalid image is rejected

- GIVEN an authenticated user in a space
- WHEN they POST a file whose mime type is not in the allowed list, or whose size exceeds the configured business limit
- THEN the request fails with HTTP 400, using the same domain exceptions (`UnsupportedFileTypeException` / `FileTooLargeException`) already thrown inside the `files` context — no photo record and no file record are created

### Requirement: Photos are listed per plant, most recent first

`PlantPhotoFindByPlantQuery` MUST return a paginated, tenant-scoped list of `PlantPhotoViewModel` for a given `plantId`, ordered descending by `createdAt`.

#### Scenario: Listing a plant's photos returns them newest-first

- GIVEN a plant with 3 uploaded photos, uploaded in order A, B, C
- WHEN `PlantPhotoFindByPlantQuery` is dispatched for that plant
- THEN the result is `[C, B, A]`

#### Scenario: Listing is tenant-isolated

- GIVEN photos uploaded for a plant in space X
- WHEN a request scoped to space Y queries that plant's photos
- THEN the result is empty (the tenant proxy scopes all reads to the active `spaceId`)

### Requirement: `plants.imageUrl` mirrors the most recent photo (best-effort)

After a successful upload, the system SHOULD update the referenced plant's `imageUrl` to the new photo's `url`, via `IPlantsPort.updateImageUrl()` dispatching `UpdatePlantCommand`. This call MUST be best-effort: if it fails (including if the plant does not exist, since `plantId` is not FK-validated), the upload as a whole MUST still succeed and the failure MUST only be logged.

#### Scenario: Plant's imageUrl reflects the latest upload

- GIVEN a plant with `imageUrl: null`
- WHEN a photo is uploaded for it
- THEN `plants.imageUrl` is updated to the new photo's `url`

#### Scenario: A dangling plantId does not fail the upload

- GIVEN a `plantId` that does not correspond to any existing plant (allowed, since `plantId` is not FK-enforced)
- WHEN a photo is uploaded for it
- THEN the `PlantPhoto` record is created successfully, `UpdatePlantCommand` fails internally with `PlantNotFoundException`, and the failure is caught and logged without failing the upload response

### Requirement: Deleting a photo resyncs `plants.imageUrl` when it was the current one

`DeletePlantPhotoCommandHandler` MUST allow only the uploader (`requestingUserId === photo.userId`) to delete a photo (403 otherwise). On successful delete, if the deleted photo's `url` equals the plant's current `imageUrl`, the handler MUST attempt to resync `imageUrl` to the next most recent remaining photo's `url`, or `null` if none remain. This resync is best-effort, same as upload.

#### Scenario: Deleting the current photo falls back to the next most recent

- GIVEN a plant with photos A (oldest), B, C (newest, currently `plants.imageUrl`)
- WHEN photo C is deleted by its uploader
- THEN photo C's underlying `File` is deleted via `IFilesPort.deleteFile`, the `PlantPhoto` record is removed, and `plants.imageUrl` is resynced to photo B's `url`

#### Scenario: Deleting a non-current photo does not touch imageUrl

- GIVEN a plant with photos A (oldest) and C (newest, currently `plants.imageUrl`)
- WHEN photo A is deleted by its uploader
- THEN `plants.imageUrl` is left unchanged

#### Scenario: A non-author cannot delete a photo

- GIVEN a photo uploaded by user U1
- WHEN user U2 attempts to delete it
- THEN the request fails with HTTP 403 and the photo is not removed
