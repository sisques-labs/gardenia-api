import { Injectable } from '@nestjs/common';

import { TaskRunAggregate } from '@contexts/tasks/domain/aggregates/task-run.aggregate';
import { TaskRunBuilder } from '@contexts/tasks/domain/builders/task-run.builder';
import { TaskRunViewModel } from '@contexts/tasks/domain/view-models/task-run.view-model';
import { TaskRunTypeOrmEntity } from '../entities/task-run.entity';

@Injectable()
export class TaskRunTypeOrmMapper {
  constructor(private readonly taskRunBuilder: TaskRunBuilder) {}

  public toDomain(entity: TaskRunTypeOrmEntity): TaskRunAggregate {
    return this.taskRunBuilder
      .withId(entity.id)
      .withTaskId(entity.taskId)
      .withAttempt(entity.attempt)
      .withStatus(entity.status)
      .withProgress(entity.progress)
      .withError(entity.error)
      .withStartedAt(entity.startedAt)
      .withEndedAt(entity.endedAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.createdAt)
      .build();
  }

  public toPersistence(aggregate: TaskRunAggregate): TaskRunTypeOrmEntity {
    const primitives = aggregate.toPrimitives();
    const entity = new TaskRunTypeOrmEntity();
    entity.id = primitives.id;
    entity.taskId = primitives.taskId;
    entity.attempt = primitives.attempt;
    entity.status = primitives.status;
    entity.progress = primitives.progress;
    entity.error = primitives.error;
    entity.startedAt = primitives.startedAt;
    entity.endedAt = primitives.endedAt;
    entity.createdAt = primitives.createdAt;
    return entity;
  }

  public toViewModel(entity: TaskRunTypeOrmEntity): TaskRunViewModel {
    return this.taskRunBuilder
      .withId(entity.id)
      .withTaskId(entity.taskId)
      .withAttempt(entity.attempt)
      .withStatus(entity.status)
      .withProgress(entity.progress)
      .withError(entity.error)
      .withStartedAt(entity.startedAt)
      .withEndedAt(entity.endedAt)
      .withCreatedAt(entity.createdAt)
      .buildViewModel();
  }
}
