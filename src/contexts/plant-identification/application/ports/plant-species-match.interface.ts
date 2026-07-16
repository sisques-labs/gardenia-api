/**
 * A species match returned by `IPlantSpeciesPort.search()`. Provider-agnostic
 * by design — `speciesKey`/`provider` describe an external catalog match
 * without this context assuming which catalog (GBIF today, potentially
 * others later) `plant-species` resolved it against.
 */
export interface PlantSpeciesMatch {
  speciesKey: number;
  scientificName: string;
  provider: string;
}
