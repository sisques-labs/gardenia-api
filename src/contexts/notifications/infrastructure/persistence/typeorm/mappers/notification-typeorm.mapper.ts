import { Injectable } from '@nestjs/common';

import { NotificationAggregate } from '@contexts/notifications/domain/aggregates/notification.aggregate';
import { NotificationBuilder } from '@contexts/notifications/domain/builders/notification.builder';
import { NotificationViewModel } from '@contexts/notifications/domain/view-models/notification.view-model';
import { NotificationTypeOrmEntity } from '../entities/notification.entity';

@Injectable()
export class NotificationTypeOrmMapper {
  constructor(private readonly builder: NotificationBuilder) {}

  public toDomain(entity: NotificationTypeOrmEntity): NotificationAggregate {
    return this.builder
      .withId(entity.id)
      .withType(entity.type)
      .withReferenceType(entity.referenceType)
      .withReferenceId(entity.referenceId)
      .withPayload(entity.payload)
      .withStatus(entity.status)
      .withReadAt(entity.readAt)
      .withResolvedAt(entity.resolvedAt)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(
    aggregate: NotificationAggregate,
  ): NotificationTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new NotificationTypeOrmEntity();
    entity.id = primitives.id;
    entity.type = primitives.type;
    entity.referenceType = primitives.referenceType;
    entity.referenceId = primitives.referenceId;
    entity.dedupeKey = primitives.dedupeKey;
    entity.payload = primitives.payload;
    entity.status = primitives.status;
    entity.readAt = primitives.readAt;
    entity.resolvedAt = primitives.resolvedAt;
    entity.userId = primitives.userId;
    entity.spaceId = primitives.spaceId;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }

  public toViewModel(entity: NotificationTypeOrmEntity): NotificationViewModel {
    return this.builder
      .withId(entity.id)
      .withType(entity.type)
      .withReferenceType(entity.referenceType)
      .withReferenceId(entity.referenceId)
      .withPayload(entity.payload)
      .withStatus(entity.status)
      .withReadAt(entity.readAt)
      .withResolvedAt(entity.resolvedAt)
      .withUserId(entity.userId)
      .withSpaceId(entity.spaceId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
