/**
 * Filterable fields exposed by the care-log find-by-criteria query.
 *
 * Each value MUST match a `CareLogEntryViewModel` field name (and its persistence
 * column), since the value flows straight into `Criteria.filters[].field`.
 */
export enum CareLogFilterFieldEnum {
  PLANT_ID = 'plantId',
  USER_ID = 'userId',
  ACTIVITY_TYPE = 'activityType',
  PERFORMED_AT = 'performedAt',
  CREATED_AT = 'createdAt',
}
