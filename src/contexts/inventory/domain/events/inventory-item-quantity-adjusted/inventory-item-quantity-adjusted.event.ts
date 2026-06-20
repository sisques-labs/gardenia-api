import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IInventoryItemQuantityAdjustedEventData } from '@contexts/inventory/domain/events/interfaces/inventory-item-quantity-adjusted-event-data.interface';

export class InventoryItemQuantityAdjustedEvent extends BaseEvent<IInventoryItemQuantityAdjustedEventData> {
  constructor(
    metadata: IEventMetadata,
    data: IInventoryItemQuantityAdjustedEventData,
  ) {
    super(metadata, data);
  }
}
