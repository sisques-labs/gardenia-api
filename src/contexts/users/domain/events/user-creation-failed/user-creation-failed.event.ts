import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export interface IUserCreationFailedEventData {
  userId: string;
  reason: string;
}

export class UserCreationFailedEvent extends BaseEvent<IUserCreationFailedEventData> {
  constructor(metadata: IEventMetadata, data: IUserCreationFailedEventData) {
    super(metadata, data);
  }
}
