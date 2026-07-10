/**
 * Whitelist of `PlantSpecies` fields a client can filter/sort by via
 * `plantSpeciesFindByCriteria`. Transport-only — not a domain concept, so it
 * lives here rather than in `domain/enums/`.
 *
 * Covers every scalar field on `PlantSpeciesViewModel` — this context is a
 * global catalog (`@SkipSpace()`), so there is no tenant-scope field to
 * exclude.
 */
export enum PlantSpeciesQueryableField {
  ID = 'id',
  SCIENTIFIC_NAME = 'scientificName',
  GBIF_KEY = 'gbifKey',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
