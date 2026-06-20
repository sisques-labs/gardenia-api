/**
 * Sortable fields exposed by `harvestsFindByCriteria`.
 *
 * Each value MUST match a `HarvestViewModel` field name (and its persistence column),
 * since the value flows straight into `Criteria.sorts[].field`.
 */
export enum HarvestSortFieldEnum {
  CROP_TYPE = 'cropType',
  QUANTITY = 'quantity',
  HARVESTED_AT = 'harvestedAt',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
