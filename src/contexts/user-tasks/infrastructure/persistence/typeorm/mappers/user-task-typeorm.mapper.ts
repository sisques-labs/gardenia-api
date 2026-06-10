import { Injectable } from '@nestjs/common';

import { UserTaskAggregate } from '@contexts/user-tasks/domain/aggregates/user-task.aggregate';
import { UserTaskBuilder } from '@contexts/user-tasks/domain/builders/user-task.builder';
import { UserTaskStatusEnum } from '@contexts/user-tasks/domain/enums/user-task-status.enum';
import { UserTaskViewModel } from '@contexts/user-tasks/domain/view-models/user-task.view-model';
import { UserTaskTypeOrmEntity } from '../entities/user-task.entity';

@Injectable()
export class UserTaskTypeOrmMapper {
  constructor(private readonly builder: UserTaskBuilder) {}

  public toDomain(entity: UserTaskTypeOrmEntity): UserTaskAggregate {
    return this.builder
      .withId(entity.id)
      .withTitle(entity.title)
      .withDescription(entity.description)
      .withStatus(entity.status as UserTaskStatusEnum)
      .withScheduledDate(entity.scheduledDate)
      .withTaskTemplateId(entity.taskTemplateId)
      .withUserId(entity.userId)
      .withCompletedAt(entity.completedAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .build();
  }

  public toPersistence(aggregate: UserTaskAggregate): UserTaskTypeOrmEntity {
    const p = aggregate.toPrimitives();
    const entity = new UserTaskTypeOrmEntity();
    entity.id = p.id;
    entity.title = p.title;
    entity.description = p.description;
    entity.status = p.status;
    entity.scheduledDate = p.scheduledDate;
    entity.taskTemplateId = p.taskTemplateId;
    entity.userId = p.userId;
    entity.completedAt = p.completedAt;
    entity.createdAt = p.createdAt;
    entity.updatedAt = p.updatedAt;
    return entity;
  }

  public toViewModel(entity: UserTaskTypeOrmEntity): UserTaskViewModel {
    return this.builder
      .withId(entity.id)
      .withTitle(entity.title)
      .withDescription(entity.description)
      .withStatus(entity.status as UserTaskStatusEnum)
      .withScheduledDate(entity.scheduledDate)
      .withTaskTemplateId(entity.taskTemplateId)
      .withUserId(entity.userId)
      .withCompletedAt(entity.completedAt)
      .withCreatedAt(entity.createdAt)
      .withUpdatedAt(entity.updatedAt)
      .buildViewModel();
  }
}
