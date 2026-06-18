import { Injectable } from '@nestjs/common';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';
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
      .withLatitude(entity.latitude != null ? Number(entity.latitude) : null)
      .withLongitude(entity.longitude != null ? Number(entity.longitude) : null)
      .withEnvironment((entity.environment as SpaceEnvironmentEnum) ?? null)
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
    entity.latitude = primitives.latitude;
    entity.longitude = primitives.longitude;
    entity.environment = primitives.environment;

    return entity;
  }
}
