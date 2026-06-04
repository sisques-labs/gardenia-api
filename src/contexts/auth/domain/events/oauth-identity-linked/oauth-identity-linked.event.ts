import { IOAuthIdentityPrimitives } from '@contexts/auth/domain/primitives/oauth-identity.primitives';
import { BaseEvent, IEventMetadata } from '@sisques-labs/nestjs-kit';

export class OAuthIdentityLinkedEvent extends BaseEvent<IOAuthIdentityPrimitives> {
  constructor(metadata: IEventMetadata, data: IOAuthIdentityPrimitives) {
    super(metadata, data);
  }
}
