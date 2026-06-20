/**
 * Filterable fields exposed by `plantingSpotsFindByCriteria`.
 *
 * Each value MUST match a `PlantingSpotViewModel` field name (and its persistence
 * column), since the value flows straight into `Criteria.filters[].field`.
 */
export enum PlantingSpotFilterFieldEnum {
  NAME = 'name',
  TYPE = 'type',
  SOIL_TYPE = 'soilType',
  USER_ID = 'userId',
  CREATED_AT = 'createdAt',
}
