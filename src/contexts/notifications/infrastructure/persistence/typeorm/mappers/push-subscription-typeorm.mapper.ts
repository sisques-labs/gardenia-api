import { Injectable } from '@nestjs/common';

import { PushSubscriptionAggregate } from '@contexts/notifications/domain/aggregates/push-subscription.aggregate';
import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
import { PushSubscriptionViewModel } from '@contexts/notifications/domain/view-models/push-subscription.view-model';

import { PushSubscriptionTypeOrmEntity } from '../entities/push-subscription.entity';

@Injectable()
export class PushSubscriptionTypeOrmMapper {
  constructor(private readonly builder: PushSubscriptionBuilder) {}

  public toDomain(
    entity: PushSubscriptionTypeOrmEntity,
  ): PushSubscriptionAggregate {
    return this.builder
      .withId(entity.id)
      .withUserId(entity.userId)
      .withEndpoint(entity.endpoint)
      .withP256dh(entity.p256dh)
      .withAuth(entity.auth)
      .withUserAgent(entity.userAgent)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toViewModel(
    entity: PushSubscriptionTypeOrmEntity,
  ): PushSubscriptionViewModel {
    return this.builder
      .withId(entity.id)
      .withUserId(entity.userId)
      .withEndpoint(entity.endpoint)
      .withP256dh(entity.p256dh)
      .withAuth(entity.auth)
      .withUserAgent(entity.userAgent)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }

  public toPersistence(
    aggregate: PushSubscriptionAggregate,
  ): PushSubscriptionTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new PushSubscriptionTypeOrmEntity();
    entity.id = primitives.id;
    entity.userId = primitives.userId;
    entity.endpoint = primitives.endpoint;
    entity.p256dh = primitives.p256dh;
    entity.auth = primitives.auth;
    entity.userAgent = primitives.userAgent;
    entity.createdAt = primitives.createdAt;
    entity.updatedAt = primitives.updatedAt;
    return entity;
  }
}
