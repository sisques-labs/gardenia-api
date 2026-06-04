import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { OAuthProviderValueObject } from '@contexts/auth/domain/value-objects/oauth-provider/oauth-provider.vo';
import { StringValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface OAuthIdentityProps {
  id: UuidValueObject;
  userId: UuidValueObject;
  provider: OAuthProviderValueObject;
  providerUserId: StringValueObject;
  email: AccountEmailValueObject | null;
  emailVerified: boolean;
  accessTokenEnc: string | null;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class OAuthIdentityEntity {
  private readonly _id: UuidValueObject;
  private readonly _userId: UuidValueObject;
  private readonly _provider: OAuthProviderValueObject;
  private readonly _providerUserId: StringValueObject;
  private readonly _email: AccountEmailValueObject | null;
  private readonly _emailVerified: boolean;
  private _accessTokenEnc: string | null;
  private _refreshTokenEnc: string | null;
  private _tokenExpiresAt: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: OAuthIdentityProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._provider = props.provider;
    this._providerUserId = props.providerUserId;
    this._email = props.email;
    this._emailVerified = props.emailVerified;
    this._accessTokenEnc = props.accessTokenEnc;
    this._refreshTokenEnc = props.refreshTokenEnc;
    this._tokenExpiresAt = props.tokenExpiresAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get id(): UuidValueObject {
    return this._id;
  }

  get userId(): UuidValueObject {
    return this._userId;
  }

  get provider(): OAuthProviderValueObject {
    return this._provider;
  }

  get providerUserId(): StringValueObject {
    return this._providerUserId;
  }

  get email(): AccountEmailValueObject | null {
    return this._email;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get accessTokenEnc(): string | null {
    return this._accessTokenEnc;
  }

  get refreshTokenEnc(): string | null {
    return this._refreshTokenEnc;
  }

  get tokenExpiresAt(): Date | null {
    return this._tokenExpiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateTokens(
    accessTokenEnc: string | null,
    refreshTokenEnc: string | null,
    tokenExpiresAt: Date | null,
  ): void {
    this._accessTokenEnc = accessTokenEnc;
    this._refreshTokenEnc = refreshTokenEnc;
    this._tokenExpiresAt = tokenExpiresAt;
    this._updatedAt = new Date();
  }

  toPrimitives(): {
    id: string;
    userId: string;
    provider: string;
    providerUserId: string;
    email: string | null;
    emailVerified: boolean;
    accessTokenEnc: string | null;
    refreshTokenEnc: string | null;
    tokenExpiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this._id.value,
      userId: this._userId.value,
      provider: this._provider.value,
      providerUserId: this._providerUserId.value,
      email: this._email?.value ?? null,
      emailVerified: this._emailVerified,
      accessTokenEnc: this._accessTokenEnc,
      refreshTokenEnc: this._refreshTokenEnc,
      tokenExpiresAt: this._tokenExpiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
