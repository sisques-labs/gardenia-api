import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { UserTaskAggregate } from '@contexts/user-tasks/domain/aggregates/user-task.aggregate';
import { UserTaskStatusEnum } from '@contexts/user-tasks/domain/enums/user-task-status.enum';
import { UserTaskCompletedAtValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-completed-at/user-task-completed-at.value-object';
import { UserTaskDescriptionValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-description/user-task-description.value-object';
import { UserTaskIdValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-id/user-task-id.value-object';
import { UserTaskScheduledDateValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-scheduled-date/user-task-scheduled-date.value-object';
import { UserTaskStatusValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-status/user-task-status.value-object';
import { UserTaskTitleValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-title/user-task-title.value-object';
import { UserTaskViewModel } from '@contexts/user-tasks/domain/view-models/user-task.view-model';

@Injectable()
export class UserTaskBuilder extends BaseBuilder<
  UserTaskAggregate,
  UserTaskViewModel
> {
  private _title!: string;
  private _description: string | null = null;
  private _status: UserTaskStatusEnum = UserTaskStatusEnum.PENDING;
  private _scheduledDate!: Date;
  private _taskTemplateId: string | null = null;
  private _userId!: string;
  private _completedAt: Date | null = null;

  withTitle(title: string): this {
    this._title = title;
    return this;
  }

  withDescription(description: string | null): this {
    this._description = description;
    return this;
  }

  withStatus(status: UserTaskStatusEnum): this {
    this._status = status;
    return this;
  }

  withScheduledDate(scheduledDate: Date): this {
    this._scheduledDate = scheduledDate;
    return this;
  }

  withTaskTemplateId(taskTemplateId: string | null): this {
    this._taskTemplateId = taskTemplateId;
    return this;
  }

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withCompletedAt(completedAt: Date | null): this {
    this._completedAt = completedAt;
    return this;
  }

  public override validate(): void {
    super.validate();
    if (!this._title) throw new FieldIsRequiredException('title');
    if (!this._userId) throw new FieldIsRequiredException('userId');
    if (!this._scheduledDate)
      throw new FieldIsRequiredException('scheduledDate');
  }

  public override build(): UserTaskAggregate {
    this.validate();
    const now = new Date();
    return new UserTaskAggregate({
      id: new UserTaskIdValueObject(this._id),
      title: new UserTaskTitleValueObject(this._title),
      description: this._description
        ? new UserTaskDescriptionValueObject(this._description)
        : null,
      status: new UserTaskStatusValueObject(this._status),
      scheduledDate: new UserTaskScheduledDateValueObject(this._scheduledDate),
      taskTemplateId: this._taskTemplateId
        ? new UuidValueObject(this._taskTemplateId)
        : null,
      userId: new UuidValueObject(this._userId),
      completedAt: this._completedAt
        ? new UserTaskCompletedAtValueObject(this._completedAt)
        : null,
      createdAt: new DateValueObject(this._createdAt ?? now),
      updatedAt: new DateValueObject(this._updatedAt ?? now),
    });
  }

  public override buildViewModel(): UserTaskViewModel {
    this.validate();
    const now = new Date();
    return new UserTaskViewModel({
      id: this._id,
      title: this._title,
      description: this._description,
      status: this._status,
      scheduledDate: this._scheduledDate,
      taskTemplateId: this._taskTemplateId,
      userId: this._userId,
      completedAt: this._completedAt,
      createdAt: this._createdAt ?? now,
      updatedAt: this._updatedAt ?? now,
    });
  }
}
