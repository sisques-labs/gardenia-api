export const PLANT_SPECIES_REFERENCE_PORT = Symbol(
  'PLANT_SPECIES_REFERENCE_PORT',
);

export interface IPlantSpeciesReferencePort {
  countPlantsBySpeciesId(plantSpeciesId: string): Promise<number>;
}
