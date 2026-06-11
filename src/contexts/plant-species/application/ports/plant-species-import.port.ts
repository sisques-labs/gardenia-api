export const PLANT_SPECIES_IMPORT_PORT = Symbol('PLANT_SPECIES_IMPORT_PORT');

export type PlantSpeciesImportRecord = {
  scientificName: string;
  description: string | null;
  imageUrl: string | null;
};

export interface IPlantSpeciesImportPort {
  fetchPage(limit: number, offset: number): Promise<PlantSpeciesImportRecord[]>;
}
