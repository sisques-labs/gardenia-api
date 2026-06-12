import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export class HarvestHarvestedAtChangedEvent extends BaseEvent<{
  id: string;
  oldValue: Date;
  newValue: Date;
}> {
  constructor(
    metadata: IEventMetadata,
    data: { id: string; oldValue: Date; newValue: Date },
  ) {
    super(metadata, data);
  }
}
