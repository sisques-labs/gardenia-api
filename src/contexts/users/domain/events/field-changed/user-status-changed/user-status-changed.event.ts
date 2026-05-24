import {
  BaseEvent,
  IEventMetadata,
  IFieldChangedEventData,
  UserStatusEnum,
} from '@sisques-labs/nestjs-kit';

export class UserStatusChangedEvent extends BaseEvent<
  IFieldChangedEventData<UserStatusEnum>
> {
  constructor(
    metadata: IEventMetadata,
    data: IFieldChangedEventData<UserStatusEnum>,
  ) {
    super(metadata, data);
  }
}
