/**
 * Whitelist of `PlantIdentification` fields a client can filter/sort by via
 * `plantIdentificationsFindByCriteria`. Transport-only — not a domain
 * concept, so it lives here rather than in `domain/enums/`.
 *
 * `spaceId` is deliberately excluded: every query is already implicitly
 * scoped to the active space via `SpaceContext`.
 */
export enum PlantIdentificationQueryableField {
  ID = 'id',
  STATUS = 'status',
  REQUESTED_BY_USER_ID = 'requestedByUserId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
