import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ISpaceMemberEventData } from '../interfaces/space-event-data.interface';

export class MemberAddedEvent extends BaseEvent<ISpaceMemberEventData> {
  constructor(metadata: IEventMetadata, data: ISpaceMemberEventData) {
    super(metadata, data);
  }
}
