import { UserStatusEnum } from '@contexts/users/enums/user-status.enum';
import { EnumValueObject } from '@sisques-labs/nestjs-kit';

export class UserStatusValueObject extends EnumValueObject<
  typeof UserStatusEnum
> {
  constructor(value: UserStatusEnum) {
    super(value);
  }

  protected get enumObject(): typeof UserStatusEnum {
    return UserStatusEnum as unknown as typeof UserStatusEnum;
  }
}
