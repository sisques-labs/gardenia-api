import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { MembershipRoleValueObject } from '@contexts/spaces/domain/value-objects/membership-role/membership-role.value-object';

export interface CreateSpaceInvitationCommandInput {
  spaceId: string;
  requestingUserId: string;
  role?: MembershipRoleEnum;
  expiresAt?: Date;
}

export class CreateSpaceInvitationCommand {
  public readonly spaceId: UuidValueObject;
  public readonly requestingUserId: UuidValueObject;
  public readonly role: MembershipRoleValueObject;
  public readonly expiresAt: Date | null;

  constructor(input: CreateSpaceInvitationCommandInput) {
    this.spaceId = new UuidValueObject(input.spaceId);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
    this.role = new MembershipRoleValueObject(
      input.role ?? MembershipRoleEnum.MEMBER,
    );
    this.expiresAt = input.expiresAt ?? null;
  }
}
