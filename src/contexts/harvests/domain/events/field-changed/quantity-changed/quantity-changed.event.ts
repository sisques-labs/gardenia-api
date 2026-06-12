import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export class HarvestQuantityChangedEvent extends BaseEvent<{
  id: string;
  oldValue: number;
  newValue: number;
}> {
  constructor(
    metadata: IEventMetadata,
    data: { id: string; oldValue: number; newValue: number },
  ) {
    super(metadata, data);
  }
}
