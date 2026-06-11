import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { EnumValueObject } from '@sisques-labs/nestjs-kit';

export class AppRoleValueObject extends EnumValueObject<typeof AppRoleEnum> {
  constructor(value: string) {
    super(value);
  }

  protected get enumObject(): typeof AppRoleEnum {
    return AppRoleEnum;
  }

  isAdmin(): boolean {
    return this.value === AppRoleEnum.ADMIN;
  }
}
