/**
 * Sortable fields exposed by `usersFindByCriteria`.
 *
 * Each value MUST match a `UserViewModel` field name (and its persistence column),
 * since the value flows straight into `Criteria.sorts[].field`.
 */
export enum UserSortFieldEnum {
  USERNAME = 'username',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
