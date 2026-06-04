import { OAuthIdentityAggregate } from '@contexts/auth/domain/aggregates/oauth-identity.aggregate';
import { OAuthIdentityBuilder } from '@contexts/auth/domain/builders/oauth-identity.builder';
import { IOAuthIdentityPrimitives } from '@contexts/auth/domain/primitives/oauth-identity.primitives';
import { Injectable } from '@nestjs/common';
import { OAuthIdentityTypeOrmEntity } from '../entities/oauth-identity.entity';

@Injectable()
export class OAuthIdentityTypeOrmMapper {
  constructor(private readonly oauthIdentityBuilder: OAuthIdentityBuilder) {}

  public toAggregate(
    entity: OAuthIdentityTypeOrmEntity,
  ): OAuthIdentityAggregate {
    return this.oauthIdentityBuilder
      .fromPrimitives(this.toEntityPrimitives(entity))
      .build();
  }

  public toEntity(
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

  private toEntityPrimitives(
    entity: OAuthIdentityTypeOrmEntity,
  ): IOAuthIdentityPrimitives {
    return {
      id: entity.id,
      userId: entity.userId,
      provider: entity.provider,
      providerUserId: entity.providerUserId,
      email: entity.email,
      emailVerified: entity.emailVerified,
      accessTokenEnc: entity.accessTokenEnc,
      refreshTokenEnc: entity.refreshTokenEnc,
      tokenExpiresAt: entity.tokenExpiresAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
