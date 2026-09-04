import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface RemoveMemberCommandInput {
  spaceId: string;
  requestingUserId: string;
  targetUserId: string;
}

export class RemoveMemberCommand {
  public readonly spaceId: UuidValueObject;
  public readonly requestingUserId: UuidValueObject;
  public readonly targetUserId: UuidValueObject;

  constructor(input: RemoveMemberCommandInput) {
    this.spaceId = new UuidValueObject(input.spaceId);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
    this.targetUserId = new UuidValueObject(input.targetUserId);
  }
}
