import { ApiTokenAggregate } from '@contexts/auth/domain/aggregates/api-token.aggregate';
import { ApiTokenPrimitives } from '@contexts/auth/domain/primitives/api-token.primitives';
import { ApiTokenViewModel } from '@contexts/auth/domain/view-models/api-token.view-model';
import { ApiTokenHashValueObject } from '@contexts/auth/domain/value-objects/api-token-hash/api-token-hash.vo';
import { ApiTokenIdValueObject } from '@contexts/auth/domain/value-objects/api-token-id/api-token-id.vo';
import { ApiTokenLabelValueObject } from '@contexts/auth/domain/value-objects/api-token-label/api-token-label.vo';
import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

@Injectable()
export class ApiTokenBuilder extends BaseBuilder<
  ApiTokenAggregate,
  ApiTokenViewModel
> {
  private _userId!: string;
  private _spaceId!: string;
  private _label!: string;
  private _tokenHash!: string;
  private _lastUsedAt: Date | null = null;
  private _revokedAt: Date | null = null;

  // Builder is a singleton — reset on each new chain so a mapper read cannot
  // leak revokedAt/lastUsedAt into an unrelated save.
  public override withId(id: string): this {
    this.reset();
    return super.withId(id);
  }

  private reset(): void {
    this._id = undefined as unknown as string;
    this._userId = undefined as unknown as string;
    this._spaceId = undefined as unknown as string;
    this._label = undefined as unknown as string;
    this._tokenHash = undefined as unknown as string;
    this._lastUsedAt = null;
    this._revokedAt = null;
    this._createdAt = undefined as unknown as Date;
    this._updatedAt = undefined as unknown as Date;
  }

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  withLabel(label: string): this {
    this._label = label;
    return this;
  }

  withTokenHash(tokenHash: string): this {
    this._tokenHash = tokenHash;
    return this;
  }

  withLastUsedAt(lastUsedAt: Date | null): this {
    this._lastUsedAt = lastUsedAt;
    return this;
  }

  withRevokedAt(revokedAt: Date | null): this {
    this._revokedAt = revokedAt;
    return this;
  }

  public override buildViewModel(): ApiTokenViewModel {
    this._createdAt = this._createdAt ?? new Date();
    this._updatedAt = this._updatedAt ?? new Date();
    this.validate();

    return new ApiTokenViewModel({
      id: this._id,
      userId: this._userId,
      spaceId: this._spaceId,
      label: this._label,
      tokenHash: this._tokenHash,
      lastUsedAt: this._lastUsedAt,
      revokedAt: this._revokedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override build(): ApiTokenAggregate {
    this._createdAt = this._createdAt ?? new Date();
    this._updatedAt = this._updatedAt ?? new Date();
    this.validate();

    return new ApiTokenAggregate({
      id: new ApiTokenIdValueObject(this._id),
      userId: new UuidValueObject(this._userId),
      spaceId: new UuidValueObject(this._spaceId),
      label: new ApiTokenLabelValueObject(this._label),
      tokenHash: new ApiTokenHashValueObject(this._tokenHash),
      lastUsedAt: this._lastUsedAt,
      revokedAt: this._revokedAt,
      createdAt: new DateValueObject(this._createdAt ?? new Date()),
      updatedAt: new DateValueObject(this._updatedAt ?? new Date()),
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
    if (!this._label) throw new FieldIsRequiredException('label');
    if (!this._tokenHash) throw new FieldIsRequiredException('tokenHash');
  }

  public fromPrimitives(primitives: ApiTokenPrimitives): this {
    return this.withId(primitives.id)
      .withUserId(primitives.userId)
      .withSpaceId(primitives.spaceId)
      .withLabel(primitives.label)
      .withTokenHash(primitives.tokenHash)
      .withLastUsedAt(primitives.lastUsedAt)
      .withRevokedAt(primitives.revokedAt)
      .withCreatedAt(primitives.createdAt)
      .withUpdatedAt(primitives.updatedAt);
  }
}
