import { Injectable } from '@nestjs/common';

import { TaskTemplateAggregate } from '@contexts/tasks/domain/aggregates/task-template.aggregate';
import { TaskTemplateBuilder } from '@contexts/tasks/domain/builders/task-template.builder';
import { TaskTemplateViewModel } from '@contexts/tasks/domain/view-models/task-template.view-model';
import { TaskTemplateTypeOrmEntity } from '../entities/task-template.entity';

@Injectable()
export class TaskTemplateTypeOrmMapper {
  constructor(private readonly builder: TaskTemplateBuilder) {}

  public toDomain(entity: TaskTemplateTypeOrmEntity): TaskTemplateAggregate {
    return this.builder
      .withId(entity.id)
      .withName(entity.name)
      .withDescription(entity.description)
      .withTaskTitle(entity.taskTitle)
      .withTaskDescription(entity.taskDescription)
      .withHandlerKey(entity.handlerKey)
      .withDefaultPriority(entity.defaultPriority)
      .withDefaultRetryCount(entity.defaultRetryCount)
      .withDefaultBackoffStrategy(entity.defaultBackoffStrategy)
      .withDefaultTimeoutMs(entity.defaultTimeoutMs)
      .withMaxConcurrency(entity.maxConcurrency)
      .withDefaultCronExpression(entity.defaultCronExpression)
      .withDefaultIsRecurring(entity.defaultIsRecurring)
      .withUserId(entity.userId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(
    aggregate: TaskTemplateAggregate,
  ): TaskTemplateTypeOrmEntity {
    const p = aggregate.toPrimitives();
    const entity = new TaskTemplateTypeOrmEntity();
    entity.id = p.id;
    entity.name = p.name;
    entity.description = p.description;
    entity.taskTitle = p.taskTitle;
    entity.taskDescription = p.taskDescription;
    entity.handlerKey = p.handlerKey;
    entity.defaultPriority = p.defaultPriority;
    entity.defaultRetryCount = p.defaultRetryCount;
    entity.defaultBackoffStrategy = p.defaultBackoffStrategy;
    entity.defaultTimeoutMs = p.defaultTimeoutMs;
    entity.maxConcurrency = p.maxConcurrency;
    entity.defaultCronExpression = p.defaultCronExpression;
    entity.defaultIsRecurring = p.defaultIsRecurring;
    entity.userId = p.userId;
    entity.createdAt = p.createdAt;
    entity.updatedAt = p.updatedAt;
    return entity;
  }

  public toViewModel(entity: TaskTemplateTypeOrmEntity): TaskTemplateViewModel {
    return this.builder
      .withId(entity.id)
      .withName(entity.name)
      .withDescription(entity.description)
      .withTaskTitle(entity.taskTitle)
      .withTaskDescription(entity.taskDescription)
      .withHandlerKey(entity.handlerKey)
      .withDefaultPriority(entity.defaultPriority)
      .withDefaultRetryCount(entity.defaultRetryCount)
      .withDefaultBackoffStrategy(entity.defaultBackoffStrategy)
      .withDefaultTimeoutMs(entity.defaultTimeoutMs)
      .withMaxConcurrency(entity.maxConcurrency)
      .withDefaultCronExpression(entity.defaultCronExpression)
      .withDefaultIsRecurring(entity.defaultIsRecurring)
      .withUserId(entity.userId)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
