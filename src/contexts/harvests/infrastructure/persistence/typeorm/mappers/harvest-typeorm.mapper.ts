import { Injectable } from '@nestjs/common';

import { HarvestAggregate } from '@contexts/harvests/domain/aggregates/harvest.aggregate';
import { HarvestBuilder } from '@contexts/harvests/domain/builders/harvest.builder';
import { HarvestViewModel } from '@contexts/harvests/domain/view-models/harvest.view-model';
import { HarvestTypeOrmEntity } from '../entities/harvest.entity';

@Injectable()
export class HarvestTypeOrmMapper {
  constructor(private readonly builder: HarvestBuilder) {}

  public toDomain(entity: HarvestTypeOrmEntity): HarvestAggregate {
    return this.builder
      .withId(entity.id)
      .withCropType(entity.cropType)
      .withQuantity(parseFloat(entity.quantity))
      .withUnit(entity.unit)
      .withHarvestedAt(entity.harvestedAt)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(aggregate: HarvestAggregate): HarvestTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new HarvestTypeOrmEntity();
    entity.id = primitives.id;
    entity.cropType = primitives.cropType;
    entity.quantity = primitives.quantity.toString();
    entity.unit = primitives.unit;
    entity.harvestedAt = primitives.harvestedAt;
    entity.userId = primitives.userId;
    entity.spaceId = primitives.spaceId;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }

  public toViewModel(entity: HarvestTypeOrmEntity): HarvestViewModel {
    return this.builder
      .withId(entity.id)
      .withCropType(entity.cropType)
      .withQuantity(parseFloat(entity.quantity))
      .withUnit(entity.unit)
      .withHarvestedAt(entity.harvestedAt)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
