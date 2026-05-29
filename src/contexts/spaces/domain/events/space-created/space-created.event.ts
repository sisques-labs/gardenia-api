import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export interface ISpaceCreatedEventData {
  spaceId: string;
  name: string;
  ownerId: string;
}

export class SpaceCreatedEvent extends BaseEvent<ISpaceCreatedEventData> {
  constructor(metadata: IEventMetadata, data: ISpaceCreatedEventData) {
    super(metadata, data);
  }
}
