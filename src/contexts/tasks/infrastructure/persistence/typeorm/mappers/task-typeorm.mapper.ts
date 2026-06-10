import { Injectable } from '@nestjs/common';

import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import { TaskBuilder } from '@contexts/tasks/domain/builders/task.builder';
import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';
import { TaskTypeOrmEntity } from '../entities/task.entity';

@Injectable()
export class TaskTypeOrmMapper {
  constructor(private readonly builder: TaskBuilder) {}

  public toDomain(entity: TaskTypeOrmEntity): TaskAggregate {
    return this.builder
      .withId(entity.id)
      .withTemplateId(entity.taskTemplateId)
      .withTriggerType(entity.triggerType)
      .withTitle(entity.title)
      .withDescription(entity.description)
      .withStatus(entity.status)
      .withPayload(entity.payload)
      .withPriority(entity.priority)
      .withDelayMs(entity.delayMs)
      .withCronExpression(entity.cronExpression)
      .withIsRecurring(entity.isRecurring)
      .withMaxRuns(entity.maxRuns)
      .withRunCount(entity.runCount)
      .withIdempotencyKey(entity.idempotencyKey)
      .withQueueJobId(entity.queueJobId)
      .withUserId(entity.userId)
      .withTargetType(entity.targetType)
      .withTargetId(entity.targetId)
      .withValidFrom(entity.validFrom)
      .withValidUntil(entity.validUntil)
      .withScheduledAt(entity.scheduledAt)
      .withStartedAt(entity.startedAt)
      .withCompletedAt(entity.completedAt)
      .withFailedAt(entity.failedAt)
      .withCancelledAt(entity.cancelledAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(aggregate: TaskAggregate): TaskTypeOrmEntity {
    const p = aggregate.toPrimitives();
    const entity = new TaskTypeOrmEntity();
    entity.id = p.id;
    entity.taskTemplateId = p.templateId;
    entity.triggerType = p.triggerType;
    entity.title = p.title;
    entity.description = p.description;
    entity.status = p.status;
    entity.payload = p.payload;
    entity.priority = p.priority;
    entity.delayMs = p.delayMs;
    entity.cronExpression = p.cronExpression;
    entity.isRecurring = p.isRecurring;
    entity.maxRuns = p.maxRuns;
    entity.runCount = p.runCount;
    entity.idempotencyKey = p.idempotencyKey;
    entity.queueJobId = p.queueJobId;
    entity.userId = p.userId;
    entity.targetType = p.targetType;
    entity.targetId = p.targetId;
    entity.validFrom = p.validFrom;
    entity.validUntil = p.validUntil;
    entity.scheduledAt = p.scheduledAt;
    entity.startedAt = p.startedAt;
    entity.completedAt = p.completedAt;
    entity.failedAt = p.failedAt;
    entity.cancelledAt = p.cancelledAt;
    entity.createdAt = p.createdAt;
    entity.updatedAt = p.updatedAt;
    return entity;
  }

  public toViewModel(entity: TaskTypeOrmEntity): TaskViewModel {
    return this.builder
      .withId(entity.id)
      .withTemplateId(entity.taskTemplateId)
      .withTriggerType(entity.triggerType)
      .withTitle(entity.title)
      .withDescription(entity.description)
      .withStatus(entity.status)
      .withPayload(entity.payload)
      .withPriority(entity.priority)
      .withDelayMs(entity.delayMs)
      .withCronExpression(entity.cronExpression)
      .withIsRecurring(entity.isRecurring)
      .withMaxRuns(entity.maxRuns)
      .withRunCount(entity.runCount)
      .withIdempotencyKey(entity.idempotencyKey)
      .withQueueJobId(entity.queueJobId)
      .withUserId(entity.userId)
      .withTargetType(entity.targetType)
      .withTargetId(entity.targetId)
      .withValidFrom(entity.validFrom)
      .withValidUntil(entity.validUntil)
      .withScheduledAt(entity.scheduledAt)
      .withStartedAt(entity.startedAt)
      .withCompletedAt(entity.completedAt)
      .withFailedAt(entity.failedAt)
      .withCancelledAt(entity.cancelledAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
