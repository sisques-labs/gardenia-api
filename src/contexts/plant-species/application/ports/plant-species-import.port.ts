export const PLANT_SPECIES_IMPORT_PORT = Symbol('PLANT_SPECIES_IMPORT_PORT');

export type PlantSpeciesImportRecord = {
  scientificName: string;
  description: string | null;
  imageUrl: string | null;
};

export interface IPlantSpeciesImportPort {
  fetchPage(limit: number, offset: number): Promise<PlantSpeciesImportRecord[]>;

  /**
   * Resolves a single scientific name against the external catalog.
   * Returns null when the name does not match a known species or when no
   * enrichment data (description or image) is available.
   */
  fetchByScientificName(
    scientificName: string,
  ): Promise<PlantSpeciesImportRecord | null>;
}
