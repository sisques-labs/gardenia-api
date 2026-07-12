/**
 * Whitelist of `Node` fields a client can filter/sort by via
 * `nodesFindByCriteria`. `spaceId` excluded (implicit via active Space).
 */
export enum NodeQueryableField {
  ID = 'id',
  BRIDGE_ID = 'bridgeId',
  NAME = 'name',
  STATUS = 'status',
  LAST_SEEN_AT = 'lastSeenAt',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
