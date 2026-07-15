export const GBIF_SPECIES_SEARCH_PORT = Symbol('GBIF_SPECIES_SEARCH_PORT');

export type GbifSpeciesSuggestion = {
  gbifKey: number;
  scientificName: string;
};

export interface IGbifSpeciesSearchPort {
  suggest(name: string, limit: number): Promise<GbifSpeciesSuggestion[]>;
}
