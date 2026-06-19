import { Injectable } from '@nestjs/common';

import { PlantingSpotAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot.aggregate';
import { PlantingSpotBuilder } from '@contexts/planting-spots/domain/builders/planting-spot.builder';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { PlantingSpotTypeOrmEntity } from '../entities/planting-spot.entity';

@Injectable()
export class PlantingSpotTypeOrmMapper {
  constructor(private readonly builder: PlantingSpotBuilder) {}

  public toDomain(entity: PlantingSpotTypeOrmEntity): PlantingSpotAggregate {
    return this.builder
      .withId(entity.id)
      .withName(entity.name)
      .withType(entity.type)
      .withDescription(entity.description)
      .withCapacity(entity.capacity)
      .withRow(entity.row)
      .withColumn(entity.column)
      .withDimensions(entity.dimensions)
      .withSoilType(entity.soilType)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(
    aggregate: PlantingSpotAggregate,
  ): PlantingSpotTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new PlantingSpotTypeOrmEntity();

    entity.id = primitives.id;
    entity.name = primitives.name;
    entity.type = primitives.type;
    entity.description = primitives.description;
    entity.capacity = primitives.capacity;
    entity.row = primitives.row;
    entity.column = primitives.column;
    entity.dimensions = primitives.dimensions;
    entity.soilType = primitives.soilType;
    entity.userId = primitives.userId;
    entity.spaceId = primitives.spaceId;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;

    return entity;
  }

  public toViewModel(entity: PlantingSpotTypeOrmEntity): PlantingSpotViewModel {
    return this.builder
      .withId(entity.id)
      .withName(entity.name)
      .withType(entity.type)
      .withDescription(entity.description)
      .withCapacity(entity.capacity)
      .withRow(entity.row)
      .withColumn(entity.column)
      .withDimensions(entity.dimensions)
      .withSoilType(entity.soilType)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
