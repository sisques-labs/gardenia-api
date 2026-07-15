/**
 * Whitelist of `Harvest` fields a client can filter/sort by via
 * `harvestsFindByCriteria`. Transport-only — not a domain concept, so it
 * lives here rather than in `domain/enums/`.
 *
 * Covers every scalar field on `HarvestViewModel`. `spaceId` is deliberately
 * excluded: every query is already implicitly scoped to the active space via
 * `SpaceContext`, so exposing it as a client-choosable filter would be
 * redundant.
 */
export enum HarvestQueryableField {
  ID = 'id',
  CROP_TYPE = 'cropType',
  QUANTITY = 'quantity',
  UNIT = 'unit',
  HARVESTED_AT = 'harvestedAt',
  USER_ID = 'userId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
