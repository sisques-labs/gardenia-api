import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export interface IMemberAddedEventData {
  spaceId: string;
  userId: string;
  role: string;
}

export class MemberAddedEvent extends BaseEvent<IMemberAddedEventData> {
  constructor(metadata: IEventMetadata, data: IMemberAddedEventData) {
    super(metadata, data);
  }
}
