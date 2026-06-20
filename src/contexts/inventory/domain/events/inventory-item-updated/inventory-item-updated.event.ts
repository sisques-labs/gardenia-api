import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IInventoryItemEventData } from '@contexts/inventory/domain/events/interfaces/inventory-item-event-data.interface';

export class InventoryItemUpdatedEvent extends BaseEvent<IInventoryItemEventData> {
  constructor(metadata: IEventMetadata, data: IInventoryItemEventData) {
    super(metadata, data);
  }
}
