/** Per-space aggregate counts published as Home Assistant hub sensors. */
export interface SpaceHaSummary {
  plantCount: number;
  harvestCount: number;
  lastHarvestAt: Date | null;
  inventoryItemCount: number;
  lowStockCount: number;
}
