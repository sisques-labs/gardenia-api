import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { AuthSessionPrimitives } from '@contexts/auth/domain/primitives/auth-session.primitives';
import { AuthSessionViewModel } from '@contexts/auth/domain/view-models/auth-session.view-model';
import { AuthSessionIdValueObject } from '@contexts/auth/domain/value-objects/auth-session-id/auth-session-id.vo';
import { RefreshTokenHashValueObject } from '@contexts/auth/domain/value-objects/refresh-token-hash/refresh-token-hash.vo';
import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

@Injectable()
export class AuthSessionBuilder extends BaseBuilder<
  AuthSessionAggregate,
  AuthSessionViewModel
> {
  private _userId!: string;
  private _tokenHash!: string;
  private _expiresAt!: Date;
  private _revokedAt: Date | null = null;
  private _deviceInfo: string | null = null;

  // Nest injects this builder as a singleton. Reset on each new chain so mapper
  // reads (fromPrimitives) cannot leak revokedAt/createdAt into login saves.
  public override withId(id: string): this {
    this.reset();
    return super.withId(id);
  }

  private reset(): void {
    this._id = undefined as unknown as string;
    this._userId = undefined as unknown as string;
    this._tokenHash = undefined as unknown as string;
    this._expiresAt = undefined as unknown as Date;
    this._revokedAt = null;
    this._deviceInfo = null;
    this._createdAt = undefined as unknown as Date;
    this._updatedAt = undefined as unknown as Date;
  }

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withTokenHash(tokenHash: string): this {
    this._tokenHash = tokenHash;
    return this;
  }

  withExpiresAt(expiresAt: Date): this {
    this._expiresAt = expiresAt;
    return this;
  }

  withRevokedAt(revokedAt: Date | null): this {
    this._revokedAt = revokedAt;
    return this;
  }

  withDeviceInfo(deviceInfo: string | null): this {
    this._deviceInfo = deviceInfo;
    return this;
  }

  public override buildViewModel(): AuthSessionViewModel {
    this._createdAt = this._createdAt ?? new Date();
    this._updatedAt = this._updatedAt ?? new Date();
    this.validate();

    return new AuthSessionViewModel({
      id: this._id,
      userId: this._userId,
      tokenHash: this._tokenHash,
      expiresAt: this._expiresAt,
      revokedAt: this._revokedAt,
      deviceInfo: this._deviceInfo,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override build(): AuthSessionAggregate {
    this._createdAt = this._createdAt ?? new Date();
    this._updatedAt = this._updatedAt ?? new Date();
    this.validate();

    return new AuthSessionAggregate({
      id: new AuthSessionIdValueObject(this._id),
      userId: new UuidValueObject(this._userId),
      tokenHash: new RefreshTokenHashValueObject(this._tokenHash),
      expiresAt: this._expiresAt,
      revokedAt: this._revokedAt,
      deviceInfo: this._deviceInfo,
      createdAt: new DateValueObject(this._createdAt ?? new Date()),
      updatedAt: new DateValueObject(this._updatedAt ?? new Date()),
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._tokenHash) throw new FieldIsRequiredException('tokenHash');
    if (!this._expiresAt) throw new FieldIsRequiredException('expiresAt');
  }

  public fromPrimitives(primitives: AuthSessionPrimitives): this {
    return this.withId(primitives.id)
      .withUserId(primitives.userId)
      .withTokenHash(primitives.tokenHash)
      .withExpiresAt(primitives.expiresAt)
      .withRevokedAt(primitives.revokedAt)
      .withDeviceInfo(primitives.deviceInfo)
      .withCreatedAt(primitives.createdAt)
      .withUpdatedAt(primitives.updatedAt);
  }
}
