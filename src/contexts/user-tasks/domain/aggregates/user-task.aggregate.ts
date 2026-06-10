import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { UserTaskStatusEnum } from '@contexts/user-tasks/domain/enums/user-task-status.enum';
import { UserTaskCancelledEvent } from '@contexts/user-tasks/domain/events/user-task-cancelled/user-task-cancelled.event';
import { UserTaskCompletedEvent } from '@contexts/user-tasks/domain/events/user-task-completed/user-task-completed.event';
import { UserTaskCreatedEvent } from '@contexts/user-tasks/domain/events/user-task-created/user-task-created.event';
import { UserTaskRescheduledEvent } from '@contexts/user-tasks/domain/events/user-task-rescheduled/user-task-rescheduled.event';
import { UserTaskNotCancellableException } from '@contexts/user-tasks/domain/exceptions/user-task-not-cancellable.exception';
import { UserTaskNotCompletableException } from '@contexts/user-tasks/domain/exceptions/user-task-not-completable.exception';
import { UserTaskNotReschedulableException } from '@contexts/user-tasks/domain/exceptions/user-task-not-reschedulable.exception';
import { IUserTask } from '@contexts/user-tasks/domain/interfaces/user-task.interface';
import { IUserTaskPrimitives } from '@contexts/user-tasks/domain/primitives/user-task.primitives';
import { UserTaskCompletedAtValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-completed-at/user-task-completed-at.value-object';
import { UserTaskIdValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-id/user-task-id.value-object';
import { UserTaskScheduledDateValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-scheduled-date/user-task-scheduled-date.value-object';
import { UserTaskStatusValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-status/user-task-status.value-object';
import { UserTaskTitleValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-title/user-task-title.value-object';
import { UserTaskDescriptionValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-description/user-task-description.value-object';

export class UserTaskAggregate extends BaseAggregate {
  private readonly _id: UserTaskIdValueObject;
  private _title: UserTaskTitleValueObject;
  private _description: UserTaskDescriptionValueObject | null;
  private _status: UserTaskStatusValueObject;
  private _scheduledDate: UserTaskScheduledDateValueObject;
  private readonly _taskTemplateId: UuidValueObject | null;
  private readonly _userId: UuidValueObject;
  private _completedAt: UserTaskCompletedAtValueObject | null;

  constructor(props: IUserTask) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._title = props.title;
    this._description = props.description;
    this._status = props.status;
    this._scheduledDate = props.scheduledDate;
    this._taskTemplateId = props.taskTemplateId;
    this._userId = props.userId;
    this._completedAt = props.completedAt;
  }

  public create(): void {
    this.apply(
      new UserTaskCreatedEvent(
        this.eventMetadata(UserTaskCreatedEvent.name),
        this.toEventData(),
      ),
    );
  }

  public complete(today: Date): void {
    if (this._status.isTerminal()) {
      if (this._status.value === UserTaskStatusEnum.CANCELLED) {
        throw new UserTaskNotCancellableException(this._status.value);
      }
      throw new UserTaskNotCompletableException(this._scheduledDate.value);
    }

    const scheduledDay = this.toDateOnly(this._scheduledDate.value);
    const todayDay = this.toDateOnly(today);

    if (scheduledDay > todayDay) {
      throw new UserTaskNotCompletableException(this._scheduledDate.value);
    }

    this._status = new UserTaskStatusValueObject(UserTaskStatusEnum.COMPLETED);
    this._completedAt = new UserTaskCompletedAtValueObject(new Date());
    this.touch();

    this.apply(
      new UserTaskCompletedEvent(
        this.eventMetadata(UserTaskCompletedEvent.name),
        this.toEventData(),
      ),
    );
  }

  public cancel(): void {
    if (this._status.value !== UserTaskStatusEnum.PENDING) {
      throw new UserTaskNotCancellableException(this._status.value);
    }

    this._status = new UserTaskStatusValueObject(UserTaskStatusEnum.CANCELLED);
    this.touch();

    this.apply(
      new UserTaskCancelledEvent(
        this.eventMetadata(UserTaskCancelledEvent.name),
        this.toEventData(),
      ),
    );
  }

  public reschedule(newDate: Date): void {
    if (this._status.value !== UserTaskStatusEnum.PENDING) {
      throw new UserTaskNotReschedulableException(this._status.value);
    }

    const oldScheduledDate = this._scheduledDate.value;
    this._scheduledDate = new UserTaskScheduledDateValueObject(newDate);
    this.touch();

    this.apply(
      new UserTaskRescheduledEvent(
        this.eventMetadata(UserTaskRescheduledEvent.name),
        {
          id: this._id.value,
          userId: this._userId.value,
          oldScheduledDate,
          newScheduledDate: newDate,
        },
      ),
    );
  }

  private toDateOnly(date: Date): number {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private eventMetadata(eventType: string) {
    return {
      aggregateRootId: this._id.value,
      aggregateRootType: UserTaskAggregate.name,
      entityId: this._id.value,
      entityType: UserTaskAggregate.name,
      eventType,
    };
  }

  private toEventData() {
    return {
      id: this._id.value,
      userId: this._userId.value,
      status: this._status.value,
      taskTemplateId: this._taskTemplateId?.value ?? null,
    };
  }

  get id(): UserTaskIdValueObject {
    return this._id;
  }

  get title(): UserTaskTitleValueObject {
    return this._title;
  }

  get description(): UserTaskDescriptionValueObject | null {
    return this._description;
  }

  get status(): UserTaskStatusValueObject {
    return this._status;
  }

  get scheduledDate(): UserTaskScheduledDateValueObject {
    return this._scheduledDate;
  }

  get taskTemplateId(): UuidValueObject | null {
    return this._taskTemplateId;
  }

  get userId(): UuidValueObject {
    return this._userId;
  }

  get completedAt(): UserTaskCompletedAtValueObject | null {
    return this._completedAt;
  }

  toPrimitives(): IUserTaskPrimitives {
    return {
      id: this._id.value,
      title: this._title.value,
      description: this._description?.value ?? null,
      status: this._status.value,
      scheduledDate: this._scheduledDate.value,
      taskTemplateId: this._taskTemplateId?.value ?? null,
      userId: this._userId.value,
      completedAt: this._completedAt?.value ?? null,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
