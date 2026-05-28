import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { AuthSessionIdValueObject } from '@contexts/auth/domain/value-objects/auth-session-id/auth-session-id.vo';
import { RefreshTokenHashValueObject } from '@contexts/auth/domain/value-objects/refresh-token-hash/refresh-token-hash.vo';
import { Injectable } from '@nestjs/common';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface AuthSessionBuildProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  deviceInfo?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class AuthSessionBuilder {
  static build(props: AuthSessionBuildProps): AuthSessionAggregate {
    return new AuthSessionAggregate({
      id: new AuthSessionIdValueObject(props.id),
      userId: new UuidValueObject(props.userId),
      tokenHash: new RefreshTokenHashValueObject(props.tokenHash),
      expiresAt: props.expiresAt,
      revokedAt: props.revokedAt ?? null,
      deviceInfo: props.deviceInfo ?? null,
      createdAt: props.createdAt ? new DateValueObject(props.createdAt) : null,
      updatedAt: props.updatedAt ? new DateValueObject(props.updatedAt) : null,
    });
  }
}
