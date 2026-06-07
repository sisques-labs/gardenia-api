import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
} from '@sisques-labs/nestjs-kit';

import { TaskRunAggregate } from '@contexts/tasks/domain/aggregates/task-run.aggregate';
import { TaskRunStatusEnum } from '@contexts/tasks/domain/enums/task-run-status.enum';
import { TaskRunViewModel } from '@contexts/tasks/domain/view-models/task-run.view-model';
import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';
import { TaskRunAttemptValueObject } from '@contexts/tasks/domain/value-objects/task-run-attempt/task-run-attempt.value-object';
import { TaskRunErrorValueObject } from '@contexts/tasks/domain/value-objects/task-run-error/task-run-error.value-object';
import { TaskRunIdValueObject } from '@contexts/tasks/domain/value-objects/task-run-id/task-run-id.value-object';
import { TaskRunProgressValueObject } from '@contexts/tasks/domain/value-objects/task-run-progress/task-run-progress.value-object';
import { TaskRunStatusValueObject } from '@contexts/tasks/domain/value-objects/task-run-status/task-run-status.value-object';

@Injectable()
export class TaskRunBuilder extends BaseBuilder<
  TaskRunAggregate,
  TaskRunViewModel
> {
  private _taskId!: string;
  private _attempt!: number;
  private _status: string = TaskRunStatusEnum.ACTIVE;
  private _progress: number = 0;
  private _error: string | null = null;
  private _startedAt!: Date;
  private _endedAt: Date | null = null;

  withTaskId(taskId: string): this {
    this._taskId = taskId;
    return this;
  }

  withAttempt(attempt: number): this {
    this._attempt = attempt;
    return this;
  }

  withStatus(status: string): this {
    this._status = status;
    return this;
  }

  withProgress(progress: number): this {
    this._progress = progress;
    return this;
  }

  withError(error: string | null): this {
    this._error = error;
    return this;
  }

  withStartedAt(startedAt: Date): this {
    this._startedAt = startedAt;
    return this;
  }

  withEndedAt(endedAt: Date | null): this {
    this._endedAt = endedAt;
    return this;
  }

  public override validate(): void {
    super.validate();
    if (!this._taskId) throw new FieldIsRequiredException('taskId');
    if (this._attempt === undefined)
      throw new FieldIsRequiredException('attempt');
    if (!this._status) throw new FieldIsRequiredException('status');
    if (!this._startedAt) throw new FieldIsRequiredException('startedAt');
  }

  public override build(): TaskRunAggregate {
    this.validate();
    const now = new Date();
    return new TaskRunAggregate({
      id: new TaskRunIdValueObject(this._id),
      taskId: new TaskIdValueObject(this._taskId),
      attempt: new TaskRunAttemptValueObject(this._attempt),
      status: new TaskRunStatusValueObject(this._status as TaskRunStatusEnum),
      progress: new TaskRunProgressValueObject(this._progress),
      error: this._error ? new TaskRunErrorValueObject(this._error) : null,
      startedAt: new DateValueObject(this._startedAt),
      endedAt: this._endedAt ? new DateValueObject(this._endedAt) : null,
      createdAt: new DateValueObject(this._createdAt ?? now),
      updatedAt: new DateValueObject(this._updatedAt ?? now),
    });
  }

  public override buildViewModel(): TaskRunViewModel {
    this.validate();
    return new TaskRunViewModel({
      id: this._id,
      taskId: this._taskId,
      attempt: this._attempt,
      status: this._status,
      progress: this._progress,
      error: this._error,
      startedAt: this._startedAt,
      endedAt: this._endedAt,
      createdAt: this._createdAt!,
    });
  }
}
