/**
 * Whitelist of `PlantPhoto` fields a client can filter/sort by via
 * `plantPhotosFindByCriteria`. Transport-only — not a domain concept, so it
 * lives here rather than in `domain/enums/`.
 *
 * `spaceId` is deliberately excluded: every query is already implicitly
 * scoped to the active space via `SpaceContext`.
 */
export enum PlantPhotoQueryableField {
  ID = 'id',
  PLANT_ID = 'plantId',
  FILE_ID = 'fileId',
  USER_ID = 'userId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
