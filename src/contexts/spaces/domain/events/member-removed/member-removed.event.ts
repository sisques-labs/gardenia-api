import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ISpaceMemberEventData } from '../interfaces/space-event-data.interface';

export class MemberRemovedEvent extends BaseEvent<
  Pick<ISpaceMemberEventData, 'spaceId' | 'userId'>
> {
  constructor(
    metadata: IEventMetadata,
    data: Pick<ISpaceMemberEventData, 'spaceId' | 'userId'>,
  ) {
    super(metadata, data);
  }
}
