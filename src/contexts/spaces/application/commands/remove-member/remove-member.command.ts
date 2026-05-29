import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';

export interface RemoveMemberCommandInput {
  spaceId: string;
  requestingUserId: string;
  targetUserId: string;
}

export class RemoveMemberCommand {
  public readonly spaceId: SpaceIdValueObject;
  public readonly requestingUserId: UuidValueObject;
  public readonly targetUserId: UuidValueObject;

  constructor(input: RemoveMemberCommandInput) {
    this.spaceId = new SpaceIdValueObject(input.spaceId);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
    this.targetUserId = new UuidValueObject(input.targetUserId);
  }
}
