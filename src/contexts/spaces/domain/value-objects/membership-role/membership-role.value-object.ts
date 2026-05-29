import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { MembershipRoleEnum } from '../../enums/membership-role.enum';

export class MembershipRoleValueObject extends EnumValueObject<
  typeof MembershipRoleEnum
> {
  constructor(value: MembershipRoleEnum) {
    super(value);
  }

  protected get enumObject(): typeof MembershipRoleEnum {
    return MembershipRoleEnum as unknown as typeof MembershipRoleEnum;
  }

  isOwner(): boolean {
    return this.value === MembershipRoleEnum.OWNER;
  }
}
