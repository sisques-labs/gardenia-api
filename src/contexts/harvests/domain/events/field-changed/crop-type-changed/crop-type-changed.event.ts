import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export class HarvestCropTypeChangedEvent extends BaseEvent<{
  id: string;
  oldValue: string;
  newValue: string;
}> {
  constructor(
    metadata: IEventMetadata,
    data: { id: string; oldValue: string; newValue: string },
  ) {
    super(metadata, data);
  }
}
