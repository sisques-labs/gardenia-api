/**
 * Filterable fields exposed by `plantSpeciesFindByCriteria`.
 *
 * Each value MUST match a `PlantSpeciesViewModel` field name (and its persistence
 * column), since the value flows straight into `Criteria.filters[].field`.
 */
export enum PlantSpeciesFilterFieldEnum {
  SCIENTIFIC_NAME = 'scientificName',
  CREATED_AT = 'createdAt',
}
