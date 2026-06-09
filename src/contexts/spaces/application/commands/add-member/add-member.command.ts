import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { MembershipRoleValueObject } from '@contexts/spaces/domain/value-objects/membership-role/membership-role.value-object';
import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';

export interface AddMemberCommandInput {
  spaceId: string;
  requestingUserId: string;
  targetUserId: string;
  role?: MembershipRoleEnum;
}

export class AddMemberCommand {
  public readonly spaceId: SpaceIdValueObject;
  public readonly requestingUserId: UuidValueObject;
  public readonly targetUserId: UuidValueObject;
  public readonly role: MembershipRoleValueObject;

  constructor(input: AddMemberCommandInput) {
    this.spaceId = new SpaceIdValueObject(input.spaceId);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
    this.targetUserId = new UuidValueObject(input.targetUserId);
    this.role = new MembershipRoleValueObject(
      input.role ?? MembershipRoleEnum.MEMBER,
    );
  }
}
