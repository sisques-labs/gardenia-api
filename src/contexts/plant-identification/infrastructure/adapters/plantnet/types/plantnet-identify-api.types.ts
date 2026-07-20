export interface PlantNetIdentifySpecies {
  scientificNameWithoutAuthor: string;
  scientificNameAuthorship?: string;
  scientificName?: string;
  commonNames?: string[];
}

export interface PlantNetIdentifyResult {
  score: number;
  species: PlantNetIdentifySpecies;
}

export interface PlantNetIdentifyApiResponse {
  results?: PlantNetIdentifyResult[];
}
