import { CreatedPlantPortResult } from '@contexts/plant-identification/application/ports/created-plant-port.result';
import { CreatePlantPortInput } from '@contexts/plant-identification/application/ports/create-plant-port.input';

export const PLANTS_PORT = Symbol('PLANTS_PORT');

/**
 * Seam into the `plants` bounded context. Implemented by an adapter that
 * dispatches `plants`' own existing `CreatePlantCommand`, unchanged,
 * including its internal `findOrCreateByGbifKey` species-linking machinery —
 * this context never writes to `plant_species` or `plants` tables directly.
 */
export interface IPlantsPort {
  createPlant(input: CreatePlantPortInput): Promise<CreatedPlantPortResult>;
}
