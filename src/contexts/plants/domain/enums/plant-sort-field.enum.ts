/**
 * Sortable fields exposed by `plantsFindByCriteria`.
 *
 * Each value MUST match a `PlantViewModel` field name (and its persistence column),
 * since the value flows straight into `Criteria.sorts[].field`.
 */
export enum PlantSortFieldEnum {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
