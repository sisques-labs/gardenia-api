import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { AuthSessionPrimitives } from '@contexts/auth/domain/primitives/auth-session.primitives';
import { Injectable } from '@nestjs/common';
import { AuthSessionEntity } from './auth-session.entity';

@Injectable()
export class AuthSessionTypeOrmMapper {
  public toDomain(entity: AuthSessionEntity): AuthSessionAggregate {
    return AuthSessionBuilder.build({
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      revokedAt: entity.revokedAt,
      deviceInfo: entity.deviceInfo,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  public toEntity(aggregate: AuthSessionAggregate): AuthSessionEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new AuthSessionEntity();
    entity.id = primitives.id;
    entity.userId = primitives.userId;
    entity.tokenHash = primitives.tokenHash;
    entity.expiresAt = primitives.expiresAt;
    entity.revokedAt = primitives.revokedAt;
    entity.deviceInfo = primitives.deviceInfo;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }

  public toPrimitives(aggregate: AuthSessionAggregate): AuthSessionPrimitives {
    return aggregate.toPrimitives();
  }
}
