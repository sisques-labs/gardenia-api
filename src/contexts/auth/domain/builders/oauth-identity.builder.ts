import { OAuthIdentityEntity } from '@contexts/auth/domain/entities/oauth-identity/oauth-identity.entity';
import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { OAuthProviderValueObject } from '@contexts/auth/domain/value-objects/oauth-provider/oauth-provider.vo';
import {
  FieldIsRequiredException,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

export class OAuthIdentityBuilder {
  private _id!: string;
  private _userId!: string;
  private _provider!: string;
  private _providerUserId!: string;
  private _email: string | null = null;
  private _emailVerified: boolean = false;
  private _accessTokenEnc: string | null = null;
  private _refreshTokenEnc: string | null = null;
  private _tokenExpiresAt: Date | null = null;
  private _createdAt: Date = new Date();
  private _updatedAt: Date = new Date();

  withId(id: string): this {
    this._id = id;
    return this;
  }

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withProvider(provider: string): this {
    this._provider = provider;
    return this;
  }

  withProviderUserId(providerUserId: string): this {
    this._providerUserId = providerUserId;
    return this;
  }

  withEmail(email: string | null): this {
    this._email = email;
    return this;
  }

  withEmailVerified(emailVerified: boolean): this {
    this._emailVerified = emailVerified;
    return this;
  }

  withAccessTokenEnc(accessTokenEnc: string | null): this {
    this._accessTokenEnc = accessTokenEnc;
    return this;
  }

  withRefreshTokenEnc(refreshTokenEnc: string | null): this {
    this._refreshTokenEnc = refreshTokenEnc;
    return this;
  }

  withTokenExpiresAt(tokenExpiresAt: Date | null): this {
    this._tokenExpiresAt = tokenExpiresAt;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this._updatedAt = updatedAt;
    return this;
  }

  validate(): void {
    if (!this._id) throw new FieldIsRequiredException('id');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._provider) throw new FieldIsRequiredException('provider');
    if (!this._providerUserId)
      throw new FieldIsRequiredException('providerUserId');
  }

  build(): OAuthIdentityEntity {
    this.validate();
    return new OAuthIdentityEntity({
      id: new UuidValueObject(this._id),
      userId: new UuidValueObject(this._userId),
      provider: new OAuthProviderValueObject(this._provider),
      providerUserId: new StringValueObject(this._providerUserId),
      email: this._email ? new AccountEmailValueObject(this._email) : null,
      emailVerified: this._emailVerified,
      accessTokenEnc: this._accessTokenEnc,
      refreshTokenEnc: this._refreshTokenEnc,
      tokenExpiresAt: this._tokenExpiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  fromPrimitives(primitives: {
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
  }): this {
    return this.withId(primitives.id)
      .withUserId(primitives.userId)
      .withProvider(primitives.provider)
      .withProviderUserId(primitives.providerUserId)
      .withEmail(primitives.email)
      .withEmailVerified(primitives.emailVerified)
      .withAccessTokenEnc(primitives.accessTokenEnc)
      .withRefreshTokenEnc(primitives.refreshTokenEnc)
      .withTokenExpiresAt(primitives.tokenExpiresAt)
      .withCreatedAt(primitives.createdAt)
      .withUpdatedAt(primitives.updatedAt);
  }
}
