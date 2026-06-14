import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ICareLogEventData } from '@contexts/care-log/domain/events/interfaces/care-log-event-data.interface';

export class CareLogEntryCreatedEvent extends BaseEvent<ICareLogEventData> {
  constructor(metadata: IEventMetadata, data: ICareLogEventData) {
    super(metadata, data);
  }
}
