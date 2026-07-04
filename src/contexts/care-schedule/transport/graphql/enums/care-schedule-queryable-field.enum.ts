/**
 * Whitelist of `CareSchedule` fields a client can filter/sort by via
 * `careSchedulesFindByCriteria`. Transport-only — not a domain concept, so it
 * lives here rather than in `domain/enums/`.
 *
 * Covers every scalar field on `CareScheduleViewModel`, plus `DUE_BEFORE` — a
 * virtual filter (not a real column) the read repository maps to
 * `next_due_at <= value`. `spaceId` is deliberately excluded: every query is
 * already implicitly scoped to the active space via `SpaceContext`, so
 * exposing it as a client-choosable filter would be redundant.
 */
export enum CareScheduleQueryableField {
  ID = 'id',
  PLANT_ID = 'plantId',
  ACTIVITY_TYPE = 'activityType',
  INTERVAL_DAYS = 'intervalDays',
  QUANTITY = 'quantity',
  UNIT = 'unit',
  NOTES = 'notes',
  NEXT_DUE_AT = 'nextDueAt',
  LAST_COMPLETED_AT = 'lastCompletedAt',
  ACTIVE = 'active',
  USER_ID = 'userId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  DUE_BEFORE = 'due_before',
}
