import { InventoryHaState } from '@contexts/home-assistant/domain/interfaces/inventory-ha-state.interface';

export const INVENTORY_STATE_PORT = Symbol('INVENTORY_STATE_PORT');

/** Reads inventory items for a space (read side of the inventory entities). */
export interface IInventoryStatePort {
  listInventory(spaceId: string): Promise<InventoryHaState[]>;
}
