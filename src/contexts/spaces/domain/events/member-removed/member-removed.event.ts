import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export interface IMemberRemovedEventData {
  spaceId: string;
  userId: string;
}

export class MemberRemovedEvent extends BaseEvent<IMemberRemovedEventData> {
  constructor(metadata: IEventMetadata, data: IMemberRemovedEventData) {
    super(metadata, data);
  }
}
