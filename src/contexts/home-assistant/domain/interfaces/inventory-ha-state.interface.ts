/** An inventory item's Home-Assistant-relevant state. */
export interface InventoryHaState {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
}
