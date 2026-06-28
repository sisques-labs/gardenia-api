import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { ICareScheduleCompletedEventData } from '@contexts/care-schedule/domain/events/interfaces/care-schedule-completed-event-data.interface';

export class CareScheduleCompletedEvent extends BaseEvent<ICareScheduleCompletedEventData> {
  constructor(metadata: IEventMetadata, data: ICareScheduleCompletedEventData) {
    super(metadata, data);
  }
}
