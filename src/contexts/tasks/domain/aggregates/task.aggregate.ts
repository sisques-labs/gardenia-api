import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskCancelledEvent } from '@contexts/tasks/domain/events/task-cancelled/task-cancelled.event';
import { TaskCompletedEvent } from '@contexts/tasks/domain/events/task-completed/task-completed.event';
import { TaskFailedEvent } from '@contexts/tasks/domain/events/task-failed/task-failed.event';
import { TaskScheduledEvent } from '@contexts/tasks/domain/events/task-scheduled/task-scheduled.event';
import { TaskSentToDlqEvent } from '@contexts/tasks/domain/events/task-sent-to-dlq/task-sent-to-dlq.event';
import { TaskStartedEvent } from '@contexts/tasks/domain/events/task-started/task-started.event';
import { TaskNotCancellableException } from '@contexts/tasks/domain/exceptions/task-not-cancellable.exception';
import { ITask } from '@contexts/tasks/domain/interfaces/task.interface';
import { ITaskPrimitives } from '@contexts/tasks/domain/primitives/task.primitives';
import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';
import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskStatusValueObject } from '@contexts/tasks/domain/value-objects/task-status/task-status.value-object';
import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';

export class TaskAggregate extends BaseAggregate {
  private readonly _id: TaskIdValueObject;
  private readonly _templateId: TaskTemplateIdValueObject;
  private _status: TaskStatusValueObject;
  private readonly _payload: Record<string, unknown>;
  private readonly _priority: TaskPriorityValueObject;
  private readonly _delayMs: number | null;
  private readonly _cronExpression: string | null;
  private readonly _isRecurring: boolean;
  private readonly _maxRuns: number | null;
  private _runCount: number;
  private readonly _idempotencyKey: string | null;
  private _queueJobId: string | null;
  private readonly _userId: UuidValueObject;
  private _scheduledAt: Date | null;
  private _startedAt: Date | null;
  private _completedAt: Date | null;
  private _failedAt: Date | null;
  private _cancelledAt: Date | null;

  constructor(props: ITask) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._templateId = props.templateId;
    this._status = props.status;
    this._payload = props.payload;
    this._priority = props.priority;
    this._delayMs = props.delayMs;
    this._cronExpression = props.cronExpression;
    this._isRecurring = props.isRecurring;
    this._maxRuns = props.maxRuns;
    this._runCount = props.runCount;
    this._idempotencyKey = props.idempotencyKey;
    this._queueJobId = props.queueJobId;
    this._userId = props.userId;
    this._scheduledAt = props.scheduledAt;
    this._startedAt = props.startedAt;
    this._completedAt = props.completedAt;
    this._failedAt = props.failedAt;
    this._cancelledAt = props.cancelledAt;
  }

  private get eventMeta() {
    return {
      aggregateRootId: this._id.value,
      aggregateRootType: TaskAggregate.name,
      entityId: this._id.value,
      entityType: TaskAggregate.name,
      eventType: '',
    };
  }

  private get baseEventData() {
    return {
      id: this._id.value,
      templateId: this._templateId.value,
      handlerKey: '',
      userId: this._userId.value,
      status: this._status.value,
    };
  }

  public schedule(): void {
    this._scheduledAt = new Date();
    this.apply(
      new TaskScheduledEvent(
        { ...this.eventMeta, eventType: TaskScheduledEvent.name },
        this.baseEventData,
      ),
    );
  }

  public start(): void {
    this._status = new TaskStatusValueObject(TaskStatusEnum.ACTIVE);
    this._startedAt = new Date();
    this._runCount += 1;
    this.touch();
    this.apply(
      new TaskStartedEvent(
        { ...this.eventMeta, eventType: TaskStartedEvent.name },
        { ...this.baseEventData, status: TaskStatusEnum.ACTIVE },
      ),
    );
  }

  public complete(): void {
    this._status = new TaskStatusValueObject(TaskStatusEnum.COMPLETED);
    this._completedAt = new Date();
    this.touch();
    this.apply(
      new TaskCompletedEvent(
        { ...this.eventMeta, eventType: TaskCompletedEvent.name },
        { ...this.baseEventData, status: TaskStatusEnum.COMPLETED },
      ),
    );
  }

  public fail(error: string): void {
    this._status = new TaskStatusValueObject(TaskStatusEnum.FAILED);
    this._failedAt = new Date();
    this.touch();
    this.apply(
      new TaskFailedEvent(
        { ...this.eventMeta, eventType: TaskFailedEvent.name },
        { ...this.baseEventData, status: TaskStatusEnum.FAILED, error },
      ),
    );
  }

  public cancel(): void {
    if (this._status.value !== TaskStatusEnum.PENDING) {
      throw new TaskNotCancellableException(this._status.value);
    }
    this._status = new TaskStatusValueObject(TaskStatusEnum.CANCELLED);
    this._cancelledAt = new Date();
    this.touch();
    this.apply(
      new TaskCancelledEvent(
        { ...this.eventMeta, eventType: TaskCancelledEvent.name },
        { ...this.baseEventData, status: TaskStatusEnum.CANCELLED },
      ),
    );
  }

  public sendToDlq(error: string): void {
    this._status = new TaskStatusValueObject(TaskStatusEnum.FAILED);
    this._failedAt = new Date();
    this.touch();
    this.apply(
      new TaskSentToDlqEvent(
        { ...this.eventMeta, eventType: TaskSentToDlqEvent.name },
        { ...this.baseEventData, status: TaskStatusEnum.FAILED, error },
      ),
    );
  }

  get id(): TaskIdValueObject {
    return this._id;
  }

  get templateId(): TaskTemplateIdValueObject {
    return this._templateId;
  }

  get status(): TaskStatusValueObject {
    return this._status;
  }

  get payload(): Record<string, unknown> {
    return this._payload;
  }

  get priority(): TaskPriorityValueObject {
    return this._priority;
  }

  get delayMs(): number | null {
    return this._delayMs;
  }

  get cronExpression(): string | null {
    return this._cronExpression;
  }

  get isRecurring(): boolean {
    return this._isRecurring;
  }

  get maxRuns(): number | null {
    return this._maxRuns;
  }

  get runCount(): number {
    return this._runCount;
  }

  get idempotencyKey(): string | null {
    return this._idempotencyKey;
  }

  get queueJobId(): string | null {
    return this._queueJobId;
  }

  get userId(): UuidValueObject {
    return this._userId;
  }

  get scheduledAt(): Date | null {
    return this._scheduledAt;
  }

  get startedAt(): Date | null {
    return this._startedAt;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get failedAt(): Date | null {
    return this._failedAt;
  }

  get cancelledAt(): Date | null {
    return this._cancelledAt;
  }

  toPrimitives(): ITaskPrimitives {
    return {
      id: this._id.value,
      templateId: this._templateId.value,
      status: this._status.value,
      payload: this._payload,
      priority: this._priority.value,
      delayMs: this._delayMs,
      cronExpression: this._cronExpression,
      isRecurring: this._isRecurring,
      maxRuns: this._maxRuns,
      runCount: this._runCount,
      idempotencyKey: this._idempotencyKey,
      queueJobId: this._queueJobId,
      userId: this._userId.value,
      scheduledAt: this._scheduledAt,
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      failedAt: this._failedAt,
      cancelledAt: this._cancelledAt,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
