import { OAuthProviderEnum } from '@contexts/auth/domain/enums/oauth-provider.enum';
import { EnumValueObject } from '@sisques-labs/nestjs-kit';

export { OAuthProviderEnum };

export class OAuthProviderValueObject extends EnumValueObject<
  typeof OAuthProviderEnum
> {
  constructor(value: string) {
    super(value);
  }

  protected get enumObject(): typeof OAuthProviderEnum {
    return OAuthProviderEnum;
  }
}
