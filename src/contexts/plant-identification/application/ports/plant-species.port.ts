import { PlantSpeciesMatch } from '@contexts/plant-identification/application/ports/plant-species-match.interface';

export const PLANT_SPECIES_PORT = Symbol('PLANT_SPECIES_PORT');

/**
 * Seam into the `plant-species` bounded context. Implemented by an adapter
 * that dispatches the existing, live, non-persisting `GbifSpeciesSearchQuery`
 * via the global `QueryBus`. Read-only — nothing is written to the
 * `plant_species` catalog by this context.
 */
export interface IPlantSpeciesPort {
  search(name: string, limit: number): Promise<PlantSpeciesMatch[]>;
}
