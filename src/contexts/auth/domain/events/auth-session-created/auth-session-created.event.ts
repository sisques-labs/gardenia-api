import { AuthSessionPrimitives } from '@contexts/auth/domain/primitives/auth-session.primitives';
import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export class AuthSessionCreatedEvent extends BaseEvent<AuthSessionPrimitives> {
  constructor(metadata: IEventMetadata, data: AuthSessionPrimitives) {
    super(metadata, data);
  }
}
