import { OAuthIdentityAggregate } from '@contexts/auth/domain/aggregates/oauth-identity.aggregate';
import { IOAuthIdentityPrimitives } from '@contexts/auth/domain/primitives/oauth-identity.primitives';
import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { OAuthProviderValueObject } from '@contexts/auth/domain/value-objects/oauth-provider/oauth-provider.vo';
import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

@Injectable()
export class OAuthIdentityBuilder extends BaseBuilder<
  OAuthIdentityAggregate,
  OAuthIdentityAggregate
> {
  private _userId!: string;
  private _provider!: string;
  private _providerUserId!: string;
  private _email: string | null = null;
  private _emailVerified: boolean = false;
  private _accessTokenEnc: string | null = null;
  private _refreshTokenEnc: string | null = null;
  private _tokenExpiresAt: Date | null = null;

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

  public override validate(): void {
    super.validate();
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._provider) throw new FieldIsRequiredException('provider');
    if (!this._providerUserId)
      throw new FieldIsRequiredException('providerUserId');
  }

  public override build(): OAuthIdentityAggregate {
    this._createdAt = this._createdAt ?? new Date();
    this._updatedAt = this._updatedAt ?? new Date();
    this.validate();

    return new OAuthIdentityAggregate({
      id: new UuidValueObject(this._id),
      userId: new UuidValueObject(this._userId),
      provider: new OAuthProviderValueObject(this._provider),
      providerUserId: new StringValueObject(this._providerUserId),
      email: this._email ? new AccountEmailValueObject(this._email) : null,
      emailVerified: this._emailVerified,
      accessTokenEnc: this._accessTokenEnc,
      refreshTokenEnc: this._refreshTokenEnc,
      tokenExpiresAt: this._tokenExpiresAt,
      createdAt: new DateValueObject(this._createdAt ?? new Date()),
      updatedAt: new DateValueObject(this._updatedAt ?? new Date()),
    });
  }

  public override buildViewModel(): OAuthIdentityAggregate {
    return this.build();
  }

  public fromPrimitives(primitives: IOAuthIdentityPrimitives): this {
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
