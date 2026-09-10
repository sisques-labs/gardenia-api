import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export interface IAccountExternalSubjectLinkedEventData {
  id: string;
  userId: string;
  externalSubject: string;
}

export class AccountExternalSubjectLinkedEvent extends BaseEvent<IAccountExternalSubjectLinkedEventData> {
  constructor(
    metadata: IEventMetadata,
    data: IAccountExternalSubjectLinkedEventData,
  ) {
    super(metadata, data);
  }
}
