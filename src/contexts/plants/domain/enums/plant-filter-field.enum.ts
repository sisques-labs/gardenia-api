/**
 * Filterable fields exposed by `plantsFindByCriteria`.
 *
 * Each value MUST match a `PlantViewModel` field name (and its persistence column),
 * since the value flows straight into `Criteria.filters[].field`.
 */
export enum PlantFilterFieldEnum {
  NAME = 'name',
  PLANT_SPECIES_ID = 'plantSpeciesId',
  PLANTING_SPOT_ID = 'plantingSpotId',
  USER_ID = 'userId',
  QR_ID = 'qrId',
  CREATED_AT = 'createdAt',
}
