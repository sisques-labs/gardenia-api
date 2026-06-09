import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ISpaceInvitationEventData } from '../interfaces/space-invitation-event-data.interface';

export class SpaceInvitationCreatedEvent extends BaseEvent<ISpaceInvitationEventData> {
  constructor(metadata: IEventMetadata, data: ISpaceInvitationEventData) {
    super(metadata, data);
  }
}
