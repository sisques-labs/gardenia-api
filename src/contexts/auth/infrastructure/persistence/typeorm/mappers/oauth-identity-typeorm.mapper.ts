import { OAuthIdentityBuilder } from '@contexts/auth/domain/builders/oauth-identity.builder';
import { OAuthIdentityEntity } from '@contexts/auth/domain/entities/oauth-identity/oauth-identity.entity';
import { Injectable } from '@nestjs/common';
import { OAuthIdentityTypeOrmEntity } from '../entities/oauth-identity.entity';

@Injectable()
export class OAuthIdentityTypeOrmMapper {
  toAggregate(entity: OAuthIdentityTypeOrmEntity): OAuthIdentityEntity {
    return new OAuthIdentityBuilder()
      .fromPrimitives({
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
      })
      .build();
  }

  toEntity(domain: OAuthIdentityEntity): OAuthIdentityTypeOrmEntity {
    const primitives = domain.toPrimitives();
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
