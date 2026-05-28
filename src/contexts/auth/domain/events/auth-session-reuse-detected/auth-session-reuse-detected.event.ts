import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export interface IAuthSessionReuseDetectedEventData {
  id: string;
  userId: string;
}

export class AuthSessionReuseDetectedEvent extends BaseEvent<IAuthSessionReuseDetectedEventData> {
  constructor(
    metadata: IEventMetadata,
    data: IAuthSessionReuseDetectedEventData,
  ) {
    super(metadata, data);
  }
}
