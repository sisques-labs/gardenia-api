export const HA_WRITE_PORT = Symbol('HA_WRITE_PORT');

/**
 * Write side of the bridge: turns Home Assistant commands into Gardenia
 * commands. The adapter dispatches via the Command bus and attributes writes
 * to the space owner (HA has no per-action user).
 */
export interface IHaWritePort {
  /** Records a watering care-log entry for the plant. */
  recordWatering(spaceId: string, plantId: string): Promise<void>;
  /** Adjusts an inventory item's quantity by `delta`. */
  adjustInventory(
    spaceId: string,
    itemId: string,
    delta: number,
  ): Promise<void>;
}
