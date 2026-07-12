/**
 * Whitelist of `Bridge` fields a client can filter/sort by via
 * `bridgesFindByCriteria`. `spaceId` excluded — already implicit via the
 * active Space (and applied manually in the repository, not via Criteria —
 * see `BridgeTypeOrmReadRepository`).
 */
export enum BridgeQueryableField {
  ID = 'id',
  NAME = 'name',
  STATUS = 'status',
  LAST_SEEN_AT = 'lastSeenAt',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
