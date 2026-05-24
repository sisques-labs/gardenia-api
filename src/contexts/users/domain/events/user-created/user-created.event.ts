import { IUserEventData } from '@contexts/users/domain/events/interfaces/user-event-data.interface';
import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export class UserCreatedEvent extends BaseEvent<IUserEventData> {
  constructor(metadata: IEventMetadata, data: IUserEventData) {
    super(metadata, data);
  }
}
