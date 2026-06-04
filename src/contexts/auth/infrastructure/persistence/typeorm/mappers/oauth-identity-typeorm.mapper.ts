import { OAuthIdentityAggregate } from '@contexts/auth/domain/aggregates/oauth-identity.aggregate';
import { OAuthIdentityBuilder } from '@contexts/auth/domain/builders/oauth-identity.builder';
import { Injectable } from '@nestjs/common';
import { OAuthIdentityTypeOrmEntity } from '../entities/oauth-identity.entity';

@Injectable()
export class OAuthIdentityTypeOrmMapper {
  constructor(private readonly builder: OAuthIdentityBuilder) {}

  public toDomain(entity: OAuthIdentityTypeOrmEntity): OAuthIdentityAggregate {
    return this.builder
      .withId(entity.id)
      .withUserId(entity.userId)
      .withProvider(entity.provider)
      .withProviderUserId(entity.providerUserId)
      .withEmail(entity.email)
      .withEmailVerified(entity.emailVerified)
      .withAccessTokenEnc(entity.accessTokenEnc)
      .withRefreshTokenEnc(entity.refreshTokenEnc)
      .withTokenExpiresAt(entity.tokenExpiresAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(
    aggregate: OAuthIdentityAggregate,
  ): OAuthIdentityTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new OAuthIdentityTypeOrmEntity();
    entity.id = primitives.id;
    entity.userId = primitives.userId;
    entity.provider = primitives.provider;
    entity.providerUserId = primitives.providerUserId;
    entity.email = primitives.email;
    entity.emailVerified = primitives.emailVerified;
    entity.accessTokenEnc = primitives.accessTokenEnc;
    entity.refreshTokenEnc = primitives.refreshTokenEnc;
    entity.tokenExpiresAt = primitives.tokenExpiresAt;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }
}
