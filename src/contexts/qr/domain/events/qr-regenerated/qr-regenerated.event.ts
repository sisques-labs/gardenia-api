import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

import { IQrEventData } from '../interfaces/qr-event-data.interface';

export class QrRegeneratedEvent extends BaseEvent<IQrEventData> {
  constructor(metadata: IEventMetadata, data: IQrEventData) {
    super(metadata, data);
  }
}
