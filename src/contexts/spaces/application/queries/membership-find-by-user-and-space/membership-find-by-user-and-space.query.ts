import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type MembershipFindByUserAndSpaceQueryInput = {
  userId: string;
  spaceId: string;
};

export class MembershipFindByUserAndSpaceQuery {
  public readonly userId: UuidValueObject;
  public readonly spaceId: UuidValueObject;

  constructor(input: MembershipFindByUserAndSpaceQueryInput) {
    this.userId = new UuidValueObject(input.userId);
    this.spaceId = new UuidValueObject(input.spaceId);
  }
}
