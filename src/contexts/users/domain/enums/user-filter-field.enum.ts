/**
 * Filterable fields exposed by `usersFindByCriteria`.
 *
 * Each value MUST match a `UserViewModel` field name (and its persistence column),
 * since the value flows straight into `Criteria.filters[].field`.
 */
export enum UserFilterFieldEnum {
  STATUS = 'status',
  USERNAME = 'username',
  LOCALE = 'locale',
  TIMEZONE = 'timezone',
  CREATED_AT = 'createdAt',
}
