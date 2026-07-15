/**
 * Whitelist of `Notification` fields a client can filter/sort by via
 * `notificationsFindByCriteria`. Transport-only — not a domain concept, so
 * it lives here rather than in `domain/enums/`.
 *
 * `userId` and `spaceId` are deliberately excluded: every query is already
 * implicitly scoped to the current user + active space server-side (see
 * notifications-module design.md "Tenant and User Isolation"), so exposing
 * either as a client-choosable filter would be redundant at best and a
 * cross-user data leak at worst.
 */
export enum NotificationQueryableField {
  ID = 'id',
  TYPE = 'type',
  REFERENCE_TYPE = 'referenceType',
  REFERENCE_ID = 'referenceId',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
