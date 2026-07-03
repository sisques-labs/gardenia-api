/**
 * Whitelist of `CareLogEntry` fields a client can filter/sort by via
 * `careLogFindByCriteria`. Transport-only — not a domain concept, so it lives
 * here rather than in `domain/enums/`.
 *
 * Covers every scalar field on `CareLogEntryViewModel`. `spaceId` is
 * deliberately excluded: every query is already implicitly scoped to the
 * active space via `SpaceContext`, so exposing it as a client-choosable
 * filter would be redundant.
 */
export enum CareLogQueryableField {
  ID = 'id',
  PLANT_ID = 'plantId',
  USER_ID = 'userId',
  ACTIVITY_TYPE = 'activityType',
  PERFORMED_AT = 'performedAt',
  NOTES = 'notes',
  QUANTITY = 'quantity',
  UNIT = 'unit',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
