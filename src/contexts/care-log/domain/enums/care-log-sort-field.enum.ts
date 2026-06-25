/**
 * Sortable fields exposed by the care-log find-by-criteria query.
 *
 * Each value MUST match a `CareLogEntryViewModel` field name (and its persistence
 * column), since the value flows straight into `Criteria.sorts[].field`.
 */
export enum CareLogSortFieldEnum {
  PERFORMED_AT = 'performedAt',
  ACTIVITY_TYPE = 'activityType',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
