import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { AuthSessionPrimitives } from '@contexts/auth/domain/primitives/auth-session.primitives';
import { AuthSessionViewModel } from '@contexts/auth/domain/view-models/auth-session.view-model';
import { Injectable } from '@nestjs/common';
import { AuthSessionEntity } from '../entities/auth-session.entity';

@Injectable()
export class AuthSessionTypeOrmMapper {
  constructor(private readonly authSessionBuilder: AuthSessionBuilder) {}

  public toAggregate(entity: AuthSessionEntity): AuthSessionAggregate {
    return this.authSessionBuilder
      .withId(entity.id)
      .withUserId(entity.userId)
      .withTokenHash(entity.tokenHash)
      .withExpiresAt(entity.expiresAt)
      .withRevokedAt(entity.revokedAt)
      .withDeviceInfo(entity.deviceInfo)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
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

  public toViewModel(entity: AuthSessionEntity): AuthSessionViewModel {
    return this.authSessionBuilder
      .withId(entity.id)
      .withUserId(entity.userId)
      .withTokenHash(entity.tokenHash)
      .withExpiresAt(entity.expiresAt)
      .withRevokedAt(entity.revokedAt)
      .withDeviceInfo(entity.deviceInfo)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }

  public toPrimitives(aggregate: AuthSessionAggregate): AuthSessionPrimitives {
    return aggregate.toPrimitives();
  }
}
