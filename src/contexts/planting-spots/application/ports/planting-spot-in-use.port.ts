export const PLANTING_SPOT_IN_USE_PORT = Symbol('PLANTING_SPOT_IN_USE_PORT');

export interface IPlantingSpotInUsePort {
  countByPlantingSpotId(plantingSpotId: string): Promise<number>;
}
