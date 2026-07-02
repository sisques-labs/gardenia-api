/**
 * Whitelist of `Plant` fields a client can filter/sort by via
 * `plantsFindByCriteria`. Transport-only — not a domain concept, so it lives
 * here rather than in `domain/enums/`.
 *
 * Covers every scalar/FK field on `PlantViewModel` that maps to a real column
 * on the `plants` table. Resolved nested fields (`species`, `qr`,
 * `plantingSpot`) are NOT queryable here — they come from other contexts via
 * adapters, not from a `plants` column, so there is nothing to filter/sort by
 * in a single `QueryBuilder` pass; use their `*Id` counterpart instead
 * (`plantSpeciesId`, `plantingSpotId`). `spaceId` is deliberately excluded
 * too: every query is already implicitly scoped to the active space via
 * `SpaceContext`, so exposing it as a client-choosable filter would be
 * redundant at best.
 */
export enum PlantQueryableField {
  ID = 'id',
  NAME = 'name',
  PLANT_SPECIES_ID = 'plantSpeciesId',
  IMAGE_URL = 'imageUrl',
  USER_ID = 'userId',
  QR_ID = 'qrId',
  PLANTING_SPOT_ID = 'plantingSpotId',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
