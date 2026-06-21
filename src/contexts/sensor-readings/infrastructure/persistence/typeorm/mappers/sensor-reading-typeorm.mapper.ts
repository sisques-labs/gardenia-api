import { Injectable } from '@nestjs/common';

import { SensorReadingAggregate } from '@contexts/sensor-readings/domain/aggregates/sensor-reading.aggregate';
import { SensorReadingBuilder } from '@contexts/sensor-readings/domain/builders/sensor-reading.builder';
import { SensorReadingViewModel } from '@contexts/sensor-readings/domain/view-models/sensor-reading.view-model';

import { SensorReadingTypeOrmEntity } from '../entities/sensor-reading.entity';

@Injectable()
export class SensorReadingTypeOrmMapper {
  constructor(private readonly builder: SensorReadingBuilder) {}

  public toDomain(entity: SensorReadingTypeOrmEntity): SensorReadingAggregate {
    return this.hydrate(entity).build();
  }

  public toViewModel(
    entity: SensorReadingTypeOrmEntity,
  ): SensorReadingViewModel {
    return this.hydrate(entity).buildViewModel();
  }

  public toPersistence(
    aggregate: SensorReadingAggregate,
  ): SensorReadingTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new SensorReadingTypeOrmEntity();
    entity.id = primitives.id;
    entity.plantId = primitives.plantId;
    entity.spaceId = primitives.spaceId;
    entity.metric = primitives.metric;
    entity.value = primitives.value.toString();
    entity.unit = primitives.unit;
    entity.measuredAt = primitives.measuredAt;
    entity.source = primitives.source;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }

  private hydrate(entity: SensorReadingTypeOrmEntity): SensorReadingBuilder {
    return this.builder
      .withId(entity.id)
      .withPlantId(entity.plantId)
      .withSpaceId(entity.spaceId)
      .withMetric(entity.metric)
      .withValue(parseFloat(entity.value))
      .withUnit(entity.unit)
      .withMeasuredAt(entity.measuredAt)
      .withSource(entity.source)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt);
  }
}
