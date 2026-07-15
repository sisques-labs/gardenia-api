import { PlantSpeciesViewModel } from '@contexts/plants/domain/view-models/plant-species.view-model';

export const PLANT_SPECIES_PORT = Symbol('PLANT_SPECIES_PORT');

export interface IPlantSpeciesPort {
  findByPlantSpeciesId(
    plantSpeciesId: string,
  ): Promise<PlantSpeciesViewModel | null>;

  findOrCreateByGbifKey(
    gbifKey: number,
    scientificName: string,
  ): Promise<{ id: string }>;
}
