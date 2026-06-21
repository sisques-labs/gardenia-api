import { ApiTokenAggregate } from '@contexts/auth/domain/aggregates/api-token.aggregate';
import { ApiTokenBuilder } from '@contexts/auth/domain/builders/api-token.builder';
import { ApiTokenPrimitives } from '@contexts/auth/domain/primitives/api-token.primitives';
import { ApiTokenViewModel } from '@contexts/auth/domain/view-models/api-token.view-model';
import { Injectable } from '@nestjs/common';

import { ApiTokenEntity } from '../entities/api-token.entity';

@Injectable()
export class ApiTokenTypeOrmMapper {
  constructor(private readonly apiTokenBuilder: ApiTokenBuilder) {}

  public toAggregate(entity: ApiTokenEntity): ApiTokenAggregate {
    return this.apiTokenBuilder
      .fromPrimitives(this.toEntityPrimitives(entity))
      .build();
  }

  public toEntity(aggregate: ApiTokenAggregate): ApiTokenEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new ApiTokenEntity();
    entity.id = primitives.id;
    entity.userId = primitives.userId;
    entity.spaceId = primitives.spaceId;
    entity.label = primitives.label;
    entity.tokenHash = primitives.tokenHash;
    entity.lastUsedAt = primitives.lastUsedAt;
    entity.revokedAt = primitives.revokedAt;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }

  public toViewModel(entity: ApiTokenEntity): ApiTokenViewModel {
    return this.apiTokenBuilder
      .fromPrimitives(this.toEntityPrimitives(entity))
      .buildViewModel();
  }

  private toEntityPrimitives(entity: ApiTokenEntity): ApiTokenPrimitives {
    return {
      id: entity.id,
      userId: entity.userId,
      spaceId: entity.spaceId,
      label: entity.label,
      tokenHash: entity.tokenHash,
      lastUsedAt: entity.lastUsedAt,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
