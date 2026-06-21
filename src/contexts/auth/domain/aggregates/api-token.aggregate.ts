import { IApiToken } from '@contexts/auth/domain/interfaces/api-token.interface';
import { ApiTokenPrimitives } from '@contexts/auth/domain/primitives/api-token.primitives';
import { ApiTokenHashValueObject } from '@contexts/auth/domain/value-objects/api-token-hash/api-token-hash.vo';
import { ApiTokenIdValueObject } from '@contexts/auth/domain/value-objects/api-token-id/api-token-id.vo';
import { ApiTokenLabelValueObject } from '@contexts/auth/domain/value-objects/api-token-label/api-token-label.vo';
import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

/**
 * A long-lived, space-scoped API token. Authenticates non-interactive clients
 * (e.g. Home Assistant's MCP client) without a refresh flow. The plaintext is
 * shown once at issuance; only its SHA-256 hash is ever stored here.
 */
export class ApiTokenAggregate extends BaseAggregate {
  private readonly _id: ApiTokenIdValueObject;
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: UuidValueObject;
  private readonly _label: ApiTokenLabelValueObject;
  private readonly _tokenHash: ApiTokenHashValueObject;
  private _lastUsedAt: Date | null;
  private _revokedAt: Date | null;

  constructor(props: IApiToken) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(props.createdAt as any, props.updatedAt as any);
    this._id = props.id;
    this._userId = props.userId;
    this._spaceId = props.spaceId;
    this._label = props.label;
    this._tokenHash = props.tokenHash;
    this._lastUsedAt = props.lastUsedAt;
    this._revokedAt = props.revokedAt;
  }

  /** True once the token has been revoked and must no longer authenticate. */
  public isRevoked(): boolean {
    return this._revokedAt !== null;
  }

  /** Idempotently revokes the token. */
  public revoke(): void {
    if (this._revokedAt !== null) {
      return;
    }
    this._revokedAt = new Date();
  }

  /** Records the moment the token was last used to authenticate. */
  public markUsed(at: Date = new Date()): void {
    this._lastUsedAt = at;
  }

  get id(): ApiTokenIdValueObject {
    return this._id;
  }

  get userId(): UuidValueObject {
    return this._userId;
  }

  get spaceId(): UuidValueObject {
    return this._spaceId;
  }

  get label(): ApiTokenLabelValueObject {
    return this._label;
  }

  get tokenHash(): ApiTokenHashValueObject {
    return this._tokenHash;
  }

  get lastUsedAt(): Date | null {
    return this._lastUsedAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  toPrimitives(): ApiTokenPrimitives {
    return {
      id: this._id.value,
      userId: this._userId.value,
      spaceId: this._spaceId.value,
      label: this._label.value,
      tokenHash: this._tokenHash.value,
      lastUsedAt: this._lastUsedAt,
      revokedAt: this._revokedAt,
      createdAt: this.createdAt?.value ?? new Date(),
      updatedAt: this.updatedAt?.value ?? new Date(),
    };
  }
}
