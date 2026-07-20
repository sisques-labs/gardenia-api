export interface CreatePlantPortInput {
  name: string;
  gbifSpeciesKey?: number | null;
  speciesScientificName?: string | null;
  imageUrl?: string | null;
  userId: string;
}
