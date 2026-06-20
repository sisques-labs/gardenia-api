/**
 * Sortable fields exposed by `plantingSpotsFindByCriteria`.
 *
 * Each value MUST match a `PlantingSpotViewModel` field name (and its persistence
 * column), since the value flows straight into `Criteria.sorts[].field`.
 */
export enum PlantingSpotSortFieldEnum {
  NAME = 'name',
  TYPE = 'type',
  CAPACITY = 'capacity',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
