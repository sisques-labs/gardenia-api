import { EnumValueObject } from '@sisques-labs/nestjs-kit';

export enum OAuthProviderEnum {
  GOOGLE = 'google',
  GITHUB = 'github',
  APPLE = 'apple',
}

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
