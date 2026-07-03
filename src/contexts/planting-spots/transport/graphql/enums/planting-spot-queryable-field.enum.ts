/**
 * Whitelist of `PlantingSpot` fields a client can filter/sort by via
 * `plantingSpotsFindByCriteria`. Transport-only — not a domain concept, so it
 * lives here rather than in `domain/enums/`.
 *
 * Covers every scalar field on `PlantingSpotViewModel`. `spaceId` is
 * deliberately excluded: every query is already implicitly scoped to the
 * active space via `SpaceContext`, so exposing it as a client-choosable
 * filter would be redundant.
 */
export enum PlantingSpotQueryableField {
  ID = 'id',
  NAME = 'name',
  TYPE = 'type',
  DESCRIPTION = 'description',
  CAPACITY = 'capacity',
  ROW = 'row',
  COLUMN = 'column',
  DIMENSIONS_WIDTH = 'dimensionsWidth',
  DIMENSIONS_HEIGHT = 'dimensionsHeight',
  DIMENSIONS_LENGTH = 'dimensionsLength',
  SOIL_TYPE = 'soilType',
  USER_ID = 'userId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
