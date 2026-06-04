import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export interface IOAuthIdentityLinkedEventData {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  email: string | null;
}

export class OAuthIdentityLinkedEvent extends BaseEvent<IOAuthIdentityLinkedEventData> {
  constructor(metadata: IEventMetadata, data: IOAuthIdentityLinkedEventData) {
    super(metadata, data);
  }
}
