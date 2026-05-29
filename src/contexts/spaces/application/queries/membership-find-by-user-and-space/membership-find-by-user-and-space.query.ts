import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';

export type MembershipFindByUserAndSpaceQueryInput = {
  userId: string;
  spaceId: string;
};

export class MembershipFindByUserAndSpaceQuery {
  public readonly userId: UuidValueObject;
  public readonly spaceId: SpaceIdValueObject;

  constructor(input: MembershipFindByUserAndSpaceQueryInput) {
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new SpaceIdValueObject(input.spaceId);
  }
}
