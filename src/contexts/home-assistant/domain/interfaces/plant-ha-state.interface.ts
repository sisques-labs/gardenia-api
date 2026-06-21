/** Snapshot of a plant's Home-Assistant-relevant state. */
export interface PlantHaState {
  plantId: string;
  name: string;
  /** Last watering timestamp from the care log, or null if never watered. */
  lastWateredAt: Date | null;
}
