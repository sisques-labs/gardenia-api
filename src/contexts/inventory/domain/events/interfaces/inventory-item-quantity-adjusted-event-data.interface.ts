export interface IInventoryItemQuantityAdjustedEventData {
  id: string;
  delta: number;
  reason: string;
  quantity: number;
}
