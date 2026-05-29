import { Injectable } from '@nestjs/common';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { SpaceEntity } from '../entities/space.entity';

@Injectable()
export class SpaceTypeOrmMapper {
  constructor(private readonly spaceBuilder: SpaceBuilder) {}

  public toDomain(entity: SpaceEntity): SpaceAggregate {
    return this.spaceBuilder
      .withId(entity.id)
      .withName(entity.name)
      .withOwnerId(entity.ownerId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(space: SpaceAggregate): Partial<SpaceEntity> {
    const primitives = space.toPrimitives();
    const entity = new SpaceEntity();

    entity.id = primitives.id;
    entity.name = primitives.name;
    entity.ownerId = primitives.ownerId;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;

    return entity;
  }
}
