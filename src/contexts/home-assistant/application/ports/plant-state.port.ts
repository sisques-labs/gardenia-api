import { PlantHaState } from '@contexts/home-assistant/domain/interfaces/plant-ha-state.interface';

export const PLANT_STATE_PORT = Symbol('PLANT_STATE_PORT');

/**
 * Reads plant state for the bridge. The implementing adapter is the only place
 * allowed to reach the plants/care-log contexts — it dispatches via QueryBus.
 */
export interface IPlantStatePort {
  /** Plant states for the given space (must run inside that space's frame). */
  listPlantStates(spaceId: string): Promise<PlantHaState[]>;
}
