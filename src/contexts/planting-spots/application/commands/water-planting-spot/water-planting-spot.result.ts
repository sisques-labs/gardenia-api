export interface WaterPlantingSpotFailure {
  plantId: string;
  reason: string;
}

export interface WaterPlantingSpotResult {
  plantingSpotId: string;
  wateredPlantIds: string[];
  failedPlants: WaterPlantingSpotFailure[];
}
