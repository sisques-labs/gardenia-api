import { Injectable } from '@nestjs/common';

import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { PlantTypeOrmEntity } from '../entities/plant.entity';

@Injectable()
export class PlantTypeOrmMapper {
  constructor(private readonly plantBuilder: PlantBuilder) {}

  public toAggregate(entity: PlantTypeOrmEntity): PlantAggregate {
    return this.plantBuilder
      .withId(entity.id)
      .withName(entity.name)
      .withSpecies(entity.species ?? null)
      .withImageUrl(entity.imageUrl ?? null)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toEntity(aggregate: PlantAggregate): PlantTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new PlantTypeOrmEntity();

    entity.id = primitives.id;
    entity.name = primitives.name;
    entity.species = primitives.species;
    entity.imageUrl = primitives.imageUrl;
    entity.userId = primitives.userId;
    entity.spaceId = primitives.spaceId;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;

    return entity;
  }

  public toViewModel(entity: PlantTypeOrmEntity): PlantViewModel {
    return this.plantBuilder
      .withId(entity.id)
      .withName(entity.name)
      .withSpecies(entity.species ?? null)
      .withImageUrl(entity.imageUrl ?? null)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
