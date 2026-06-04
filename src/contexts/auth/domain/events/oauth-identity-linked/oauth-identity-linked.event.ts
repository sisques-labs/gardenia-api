import { IOAuthIdentityLinkedEventData } from '@contexts/auth/domain/events/interfaces/oauth-identity-event-data.interface';
import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export class OAuthIdentityLinkedEvent extends BaseEvent<IOAuthIdentityLinkedEventData> {
  constructor(metadata: IEventMetadata, data: IOAuthIdentityLinkedEventData) {
    super(metadata, data);
  }
}
