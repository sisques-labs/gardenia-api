import { BaseAggregate, DateValueObject } from '@sisques-labs/nestjs-kit';

import { TaskRunStatusEnum } from '@contexts/tasks/domain/enums/task-run-status.enum';
import { TaskRunCompletedEvent } from '@contexts/tasks/domain/events/task-run-completed/task-run-completed.event';
import { TaskRunCreatedEvent } from '@contexts/tasks/domain/events/task-run-created/task-run-created.event';
import { TaskRunFailedEvent } from '@contexts/tasks/domain/events/task-run-failed/task-run-failed.event';
import { ITaskRun } from '@contexts/tasks/domain/interfaces/task-run.interface';
import { ITaskRunPrimitives } from '@contexts/tasks/domain/primitives/task-run.primitives';
import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';
import { TaskRunAttemptValueObject } from '@contexts/tasks/domain/value-objects/task-run-attempt/task-run-attempt.value-object';
import { TaskRunErrorValueObject } from '@contexts/tasks/domain/value-objects/task-run-error/task-run-error.value-object';
import { TaskRunIdValueObject } from '@contexts/tasks/domain/value-objects/task-run-id/task-run-id.value-object';
import { TaskRunProgressValueObject } from '@contexts/tasks/domain/value-objects/task-run-progress/task-run-progress.value-object';
import { TaskRunStatusValueObject } from '@contexts/tasks/domain/value-objects/task-run-status/task-run-status.value-object';

export class TaskRunAggregate extends BaseAggregate {
  private readonly _id: TaskRunIdValueObject;
  private readonly _taskId: TaskIdValueObject;
  private readonly _attempt: TaskRunAttemptValueObject;
  private _status: TaskRunStatusValueObject;
  private _progress: TaskRunProgressValueObject;
  private _error: TaskRunErrorValueObject | null;
  private readonly _startedAt: DateValueObject;
  private _endedAt: DateValueObject | null;

  constructor(props: ITaskRun) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._taskId = props.taskId;
    this._attempt = props.attempt;
    this._status = props.status;
    this._progress = props.progress;
    this._error = props.error;
    this._startedAt = props.startedAt;
    this._endedAt = props.endedAt;
  }

  public create(): void {
    this.apply(
      new TaskRunCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskRunAggregate.name,
          entityId: this._id.value,
          entityType: TaskRunAggregate.name,
          eventType: TaskRunCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public updateProgress(progress: number): void {
    this._progress = new TaskRunProgressValueObject(progress);
    this.touch();
  }

  public complete(): void {
    this._status = new TaskRunStatusValueObject(TaskRunStatusEnum.COMPLETED);
    this._endedAt = new DateValueObject(new Date());
    this.touch();
    this.apply(
      new TaskRunCompletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskRunAggregate.name,
          entityId: this._id.value,
          entityType: TaskRunAggregate.name,
          eventType: TaskRunCompletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public fail(error: string): void {
    this._status = new TaskRunStatusValueObject(TaskRunStatusEnum.FAILED);
    this._error = new TaskRunErrorValueObject(error);
    this._endedAt = new DateValueObject(new Date());
    this.touch();
    this.apply(
      new TaskRunFailedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskRunAggregate.name,
          entityId: this._id.value,
          entityType: TaskRunAggregate.name,
          eventType: TaskRunFailedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  get id(): TaskRunIdValueObject {
    return this._id;
  }

  get taskId(): TaskIdValueObject {
    return this._taskId;
  }

  get attempt(): TaskRunAttemptValueObject {
    return this._attempt;
  }

  get status(): TaskRunStatusValueObject {
    return this._status;
  }

  get progress(): TaskRunProgressValueObject {
    return this._progress;
  }

  get error(): TaskRunErrorValueObject | null {
    return this._error;
  }

  get startedAt(): DateValueObject {
    return this._startedAt;
  }

  get endedAt(): DateValueObject | null {
    return this._endedAt;
  }

  toPrimitives(): ITaskRunPrimitives {
    return {
      id: this._id.value,
      taskId: this._taskId.value,
      attempt: this._attempt.value,
      status: this._status.value,
      progress: this._progress.value,
      error: this._error?.value ?? null,
      startedAt: this._startedAt.value,
      endedAt: this._endedAt?.value ?? null,
      createdAt: this.createdAt.value,
    };
  }
}
