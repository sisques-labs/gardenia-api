/**
 * Filterable fields exposed by `harvestsFindByCriteria`.
 *
 * Each value MUST match a `HarvestViewModel` field name (and its persistence column),
 * since the value flows straight into `Criteria.filters[].field`.
 */
export enum HarvestFilterFieldEnum {
  CROP_TYPE = 'cropType',
  UNIT = 'unit',
  USER_ID = 'userId',
  HARVESTED_AT = 'harvestedAt',
  CREATED_AT = 'createdAt',
}
