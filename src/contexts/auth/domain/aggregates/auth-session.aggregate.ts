import { AuthSessionCreatedEvent } from '@contexts/auth/domain/events/auth-session-created/auth-session-created.event';
import { AuthSessionReuseDetectedEvent } from '@contexts/auth/domain/events/auth-session-reuse-detected/auth-session-reuse-detected.event';
import { AuthSessionRevokedEvent } from '@contexts/auth/domain/events/auth-session-revoked/auth-session-revoked.event';
import { IAuthSession } from '@contexts/auth/domain/interfaces/auth-session.interface';
import { AuthSessionPrimitives } from '@contexts/auth/domain/primitives/auth-session.primitives';
import { AuthSessionIdValueObject } from '@contexts/auth/domain/value-objects/auth-session-id/auth-session-id.vo';
import { RefreshTokenHashValueObject } from '@contexts/auth/domain/value-objects/refresh-token-hash/refresh-token-hash.vo';
import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

export class AuthSessionAggregate extends BaseAggregate {
  private readonly _id: AuthSessionIdValueObject;
  private readonly _userId: UuidValueObject;
  private readonly _tokenHash: RefreshTokenHashValueObject;
  private readonly _expiresAt: Date;
  private _revokedAt: Date | null;
  private readonly _deviceInfo: string | null;

  constructor(props: IAuthSession) {
    super(props.createdAt as any, props.updatedAt as any);
    this._id = props.id;
    this._userId = props.userId;
    this._tokenHash = props.tokenHash;
    this._expiresAt = props.expiresAt;
    this._revokedAt = props.revokedAt;
    this._deviceInfo = props.deviceInfo;
  }

  public create(): void {
    this.apply(
      new AuthSessionCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: AuthSessionAggregate.name,
          entityId: this._id.value,
          entityType: AuthSessionAggregate.name,
          eventType: AuthSessionCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public revoke(reason: string): void {
    if (this._revokedAt !== null) {
      return;
    }

    this._revokedAt = new Date();

    this.apply(
      new AuthSessionRevokedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: AuthSessionAggregate.name,
          entityId: this._id.value,
          entityType: AuthSessionAggregate.name,
          eventType: AuthSessionRevokedEvent.name,
        },
        {
          id: this._id.value,
          userId: this._userId.value,
          reason,
        },
      ),
    );
  }

  public markReuseDetected(): void {
    this.apply(
      new AuthSessionReuseDetectedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: AuthSessionAggregate.name,
          entityId: this._id.value,
          entityType: AuthSessionAggregate.name,
          eventType: AuthSessionReuseDetectedEvent.name,
        },
        {
          id: this._id.value,
          userId: this._userId.value,
        },
      ),
    );
  }

  get id(): AuthSessionIdValueObject {
    return this._id;
  }

  get userId(): UuidValueObject {
    return this._userId;
  }

  get tokenHash(): RefreshTokenHashValueObject {
    return this._tokenHash;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }

  get deviceInfo(): string | null {
    return this._deviceInfo;
  }

  toPrimitives(): AuthSessionPrimitives {
    return {
      id: this._id.value,
      userId: this._userId.value,
      tokenHash: this._tokenHash.value,
      expiresAt: this._expiresAt,
      revokedAt: this._revokedAt,
      deviceInfo: this._deviceInfo,
      createdAt: this.createdAt?.value ?? new Date(),
      updatedAt: this.updatedAt?.value ?? new Date(),
    };
  }
}
