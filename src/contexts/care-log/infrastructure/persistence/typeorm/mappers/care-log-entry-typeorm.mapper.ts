import { Injectable } from '@nestjs/common';

import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';
import { CareLogEntryBuilder } from '@contexts/care-log/domain/builders/care-log-entry.builder';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { CareLogEntryTypeOrmEntity } from '../entities/care-log-entry.entity';

@Injectable()
export class CareLogEntryTypeOrmMapper {
  constructor(private readonly builder: CareLogEntryBuilder) {}

  public toDomain(entity: CareLogEntryTypeOrmEntity): CareLogEntryAggregate {
    return this.builder
      .withId(entity.id)
      .withPlantId(entity.plantId)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withActivityType(entity.activityType)
      .withPerformedAt(entity.performedAt)
      .withNotes(entity.notes)
      .withQuantity(entity.quantity)
      .withUnit(entity.unit)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(
    aggregate: CareLogEntryAggregate,
  ): CareLogEntryTypeOrmEntity {
    const p = aggregate.toPrimitives();
    const entity = new CareLogEntryTypeOrmEntity();
    entity.id = p.id;
    entity.plantId = p.plantId;
    entity.userId = p.userId;
    entity.spaceId = p.spaceId;
    entity.activityType = p.activityType;
    entity.performedAt = p.performedAt;
    entity.notes = p.notes;
    entity.quantity = p.quantity;
    entity.unit = p.unit;
    entity.createdAt = p.createdAt;
    entity.updatedAt = p.updatedAt;
    return entity;
  }

  public toViewModel(entity: CareLogEntryTypeOrmEntity): CareLogEntryViewModel {
    return this.builder
      .withId(entity.id)
      .withPlantId(entity.plantId)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withActivityType(entity.activityType)
      .withPerformedAt(entity.performedAt)
      .withNotes(entity.notes)
      .withQuantity(entity.quantity)
      .withUnit(entity.unit)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
