import { IAccountEventData } from '@contexts/auth/domain/events/interfaces/account-event-data.interface';
import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export class AccountDeletedEvent extends BaseEvent<IAccountEventData> {
  constructor(metadata: IEventMetadata, data: IAccountEventData) {
    super(metadata, data);
  }
}
