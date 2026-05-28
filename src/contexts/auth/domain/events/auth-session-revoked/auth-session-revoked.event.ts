import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export interface IAuthSessionRevokedEventData {
  id: string;
  userId: string;
  reason: string;
}

export class AuthSessionRevokedEvent extends BaseEvent<IAuthSessionRevokedEventData> {
  constructor(metadata: IEventMetadata, data: IAuthSessionRevokedEventData) {
    super(metadata, data);
  }
}
