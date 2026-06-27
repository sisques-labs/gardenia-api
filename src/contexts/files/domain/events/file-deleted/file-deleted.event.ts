import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IFileEventData } from '@contexts/files/domain/events/interfaces/file-event-data.interface';

export class FileDeletedEvent extends BaseEvent<IFileEventData> {
  constructor(metadata: IEventMetadata, data: IFileEventData) {
    super(metadata, data);
  }
}
