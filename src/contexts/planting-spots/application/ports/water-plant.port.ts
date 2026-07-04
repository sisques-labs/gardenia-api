export const WATER_PLANT_PORT = Symbol('WATER_PLANT_PORT');

export interface WaterPlantPortInput {
  plantId: string;
  userId: string;
  spaceId: string;
  performedAt?: Date;
}

export interface IWaterPlantPort {
  waterPlant(input: WaterPlantPortInput): Promise<void>;
}
