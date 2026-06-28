import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ICareScheduleEventData } from '@contexts/care-schedule/domain/events/interfaces/care-schedule-event-data.interface';

export class CareScheduleDeletedEvent extends BaseEvent<ICareScheduleEventData> {
  constructor(metadata: IEventMetadata, data: ICareScheduleEventData) {
    super(metadata, data);
  }
}
