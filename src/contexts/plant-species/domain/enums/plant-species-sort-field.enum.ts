/**
 * Sortable fields exposed by `plantSpeciesFindByCriteria`.
 *
 * Each value MUST match a `PlantSpeciesViewModel` field name (and its persistence
 * column), since the value flows straight into `Criteria.sorts[].field`.
 */
export enum PlantSpeciesSortFieldEnum {
  SCIENTIFIC_NAME = 'scientificName',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
