import { Injectable } from '@nestjs/common';

import { CareScheduleAggregate } from '@contexts/care-schedule/domain/aggregates/care-schedule.aggregate';
import { CareScheduleBuilder } from '@contexts/care-schedule/domain/builders/care-schedule.builder';
import { CareScheduleViewModel } from '@contexts/care-schedule/domain/view-models/care-schedule.view-model';
import { CareScheduleTypeOrmEntity } from '../entities/care-schedule.entity';

@Injectable()
export class CareScheduleTypeOrmMapper {
  constructor(private readonly builder: CareScheduleBuilder) {}

  private hydrate(entity: CareScheduleTypeOrmEntity): CareScheduleBuilder {
    return this.builder
      .withId(entity.id)
      .withPlantId(entity.plantId)
      .withActivityType(entity.activityType)
      .withIntervalDays(Number(entity.intervalDays))
      .withQuantity(
        entity.quantity != null ? parseFloat(entity.quantity) : null,
      )
      .withUnit(entity.unit)
      .withNotes(entity.notes)
      .withNextDueAt(entity.nextDueAt)
      .withLastCompletedAt(entity.lastCompletedAt)
      .withActive(entity.active)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt);
  }

  public toDomain(entity: CareScheduleTypeOrmEntity): CareScheduleAggregate {
    return this.hydrate(entity).build();
  }

  public toViewModel(entity: CareScheduleTypeOrmEntity): CareScheduleViewModel {
    return this.hydrate(entity).buildViewModel();
  }

  public toPersistence(
    aggregate: CareScheduleAggregate,
  ): CareScheduleTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new CareScheduleTypeOrmEntity();
    entity.id = primitives.id;
    entity.plantId = primitives.plantId;
    entity.activityType = primitives.activityType;
    entity.intervalDays = primitives.intervalDays;
    entity.quantity =
      primitives.quantity != null ? primitives.quantity.toString() : null;
    entity.unit = primitives.unit;
    entity.notes = primitives.notes;
    entity.nextDueAt = primitives.nextDueAt;
    entity.lastCompletedAt = primitives.lastCompletedAt;
    entity.active = primitives.active;
    entity.userId = primitives.userId;
    entity.spaceId = primitives.spaceId;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }
}
