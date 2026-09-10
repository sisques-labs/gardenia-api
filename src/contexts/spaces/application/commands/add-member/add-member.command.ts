import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { MembershipRoleValueObject } from '@contexts/spaces/domain/value-objects/membership-role/membership-role.value-object';

export interface AddMemberCommandInput {
  spaceId: string;
  requestingUserId: string;
  targetUserId: string;
  role?: MembershipRoleEnum;
  /**
   * The requesting owner's own verified platform (Sisques Account) bearer
   * token, when the request is platform-linked (design.md D7's pattern,
   * applied to the `space-tenant-mapping` spec's "Platform Write Authority
   * for Membership" requirement). `null`/omitted means a native request —
   * today's local-write behavior is preserved unchanged.
   */
  platformAccessToken?: string | null;
}

export class AddMemberCommand {
  public readonly spaceId: UuidValueObject;
  public readonly requestingUserId: UuidValueObject;
  public readonly targetUserId: UuidValueObject;
  public readonly role: MembershipRoleValueObject;
  public readonly platformAccessToken: string | null;

  constructor(input: AddMemberCommandInput) {
    this.spaceId = new UuidValueObject(input.spaceId);
    this.requestingUserId = new UuidValueObject(input.requestingUserId);
    this.targetUserId = new UuidValueObject(input.targetUserId);
    this.role = new MembershipRoleValueObject(
      input.role ?? MembershipRoleEnum.MEMBER,
    );
    this.platformAccessToken = input.platformAccessToken ?? null;
  }
}
