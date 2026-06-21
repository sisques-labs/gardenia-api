/** A latest physical reading surfaced back to Home Assistant. */
export interface PlantReadingHaState {
  metric: string;
  value: number;
  unit: string;
}

/** Snapshot of a plant's Home-Assistant-relevant state. */
export interface PlantHaState {
  plantId: string;
  name: string;
  /** Last watering timestamp from the care log, or null if never watered. */
  lastWateredAt: Date | null;
  /** Latest physical reading per metric ingested from HA. */
  readings: PlantReadingHaState[];
}
