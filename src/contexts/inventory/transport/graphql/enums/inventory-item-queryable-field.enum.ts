/**
 * Whitelist of `InventoryItem` fields a client can filter/sort by via
 * `inventoryItemsFindByCriteria`. Transport-only — not a domain concept, so
 * it lives here rather than in `domain/enums/`.
 *
 * Covers every scalar field on `InventoryItemViewModel`, plus `LOW_STOCK` — a
 * virtual boolean filter (not a real column) the read repository maps to
 * `quantity <= low_stock_threshold`. `spaceId` is deliberately excluded:
 * every query is already implicitly scoped to the active space via
 * `SpaceContext`, so exposing it as a client-choosable filter would be
 * redundant.
 */
export enum InventoryItemQueryableField {
  ID = 'id',
  ITEM_TYPE = 'itemType',
  NAME = 'name',
  BRAND = 'brand',
  NOTES = 'notes',
  QUANTITY = 'quantity',
  UNIT = 'unit',
  LOW_STOCK_THRESHOLD = 'lowStockThreshold',
  ACQUIRED_AT = 'acquiredAt',
  EXPIRES_AT = 'expiresAt',
  USER_ID = 'userId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LOW_STOCK = 'low_stock',
}
