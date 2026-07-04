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
      .withDimensionsWidth(
        entity.dimensionsWidth != null ? Number(entity.dimensionsWidth) : null,
      )
      .withDimensionsHeight(
        entity.dimensionsHeight != null
          ? Number(entity.dimensionsHeight)
          : null,
      )
      .withDimensionsLength(
        entity.dimensionsLength != null
          ? Number(entity.dimensionsLength)
          : null,
      )
      .withSoilType(entity.soilType)
      .withStatus(entity.status)
      .withFallowSince(entity.fallowSince)
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
    entity.dimensionsWidth = primitives.dimensionsWidth;
    entity.dimensionsHeight = primitives.dimensionsHeight;
    entity.dimensionsLength = primitives.dimensionsLength;
    entity.soilType = primitives.soilType;
    entity.status = primitives.status;
    entity.fallowSince = primitives.fallowSince;
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
      .withDimensionsWidth(
        entity.dimensionsWidth != null ? Number(entity.dimensionsWidth) : null,
      )
      .withDimensionsHeight(
        entity.dimensionsHeight != null
          ? Number(entity.dimensionsHeight)
          : null,
      )
      .withDimensionsLength(
        entity.dimensionsLength != null
          ? Number(entity.dimensionsLength)
          : null,
      )
      .withSoilType(entity.soilType)
      .withStatus(entity.status)
      .withFallowSince(entity.fallowSince)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
