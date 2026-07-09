import { Injectable } from '@nestjs/common';

import { PlantPhotoAggregate } from '@contexts/plant-photos/domain/aggregates/plant-photo.aggregate';
import { PlantPhotoBuilder } from '@contexts/plant-photos/domain/builders/plant-photo.builder';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { PlantPhotoTypeOrmEntity } from '../entities/plant-photo.entity';

@Injectable()
export class PlantPhotoTypeOrmMapper {
  constructor(private readonly builder: PlantPhotoBuilder) {}

  public toDomain(entity: PlantPhotoTypeOrmEntity): PlantPhotoAggregate {
    return this.builder
      .withId(entity.id)
      .withPlantId(entity.plantId)
      .withFileId(entity.fileId)
      .withUrl(entity.url)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(
    aggregate: PlantPhotoAggregate,
  ): PlantPhotoTypeOrmEntity {
    const p = aggregate.toPrimitives();
    const entity = new PlantPhotoTypeOrmEntity();
    entity.id = p.id;
    entity.plantId = p.plantId;
    entity.fileId = p.fileId;
    entity.url = p.url;
    entity.userId = p.userId;
    entity.spaceId = p.spaceId;
    entity.createdAt = p.createdAt;
    entity.updatedAt = p.updatedAt;
    return entity;
  }

  public toViewModel(entity: PlantPhotoTypeOrmEntity): PlantPhotoViewModel {
    return this.builder
      .withId(entity.id)
      .withPlantId(entity.plantId)
      .withFileId(entity.fileId)
      .withUrl(entity.url)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
