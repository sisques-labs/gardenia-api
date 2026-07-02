/**
 * Whitelist of `Plant` fields a client can filter/sort by via
 * `plantsFindByCriteria`. Transport-only — not a domain concept, so it lives
 * here rather than in `domain/enums/`.
 */
export enum PlantQueryableField {
  NAME = 'name',
  PLANT_SPECIES_ID = 'plantSpeciesId',
  PLANTING_SPOT_ID = 'plantingSpotId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
