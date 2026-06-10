import {
  BaseAggregate,
  DateValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { TaskCancelledEvent } from '@contexts/tasks/domain/events/task-cancelled/task-cancelled.event';
import { TaskCompletedEvent } from '@contexts/tasks/domain/events/task-completed/task-completed.event';
import { TaskFailedEvent } from '@contexts/tasks/domain/events/task-failed/task-failed.event';
import { TaskRescheduledEvent } from '@contexts/tasks/domain/events/task-rescheduled/task-rescheduled.event';
import { TaskScheduledEvent } from '@contexts/tasks/domain/events/task-scheduled/task-scheduled.event';
import { TaskSentToDlqEvent } from '@contexts/tasks/domain/events/task-sent-to-dlq/task-sent-to-dlq.event';
import { TaskStartedEvent } from '@contexts/tasks/domain/events/task-started/task-started.event';
import { TaskNotCancellableException } from '@contexts/tasks/domain/exceptions/task-not-cancellable.exception';
import { TaskNotCompletableException } from '@contexts/tasks/domain/exceptions/task-not-completable.exception';
import { TaskNotReschedulableException } from '@contexts/tasks/domain/exceptions/task-not-reschedulable.exception';
import { ITask } from '@contexts/tasks/domain/interfaces/task.interface';
import { ITaskPrimitives } from '@contexts/tasks/domain/primitives/task.primitives';
import { TaskCronExpressionValueObject } from '@contexts/tasks/domain/value-objects/task-cron-expression/task-cron-expression.value-object';
import { TaskDelayMsValueObject } from '@contexts/tasks/domain/value-objects/task-delay-ms/task-delay-ms.value-object';
import { TaskDescriptionValueObject } from '@contexts/tasks/domain/value-objects/task-description/task-description.value-object';
import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';
import { TaskIdempotencyKeyValueObject } from '@contexts/tasks/domain/value-objects/task-idempotency-key/task-idempotency-key.value-object';
import { TaskIsRecurringValueObject } from '@contexts/tasks/domain/value-objects/task-is-recurring/task-is-recurring.value-object';
import { TaskMaxRunsValueObject } from '@contexts/tasks/domain/value-objects/task-max-runs/task-max-runs.value-object';
import { TaskNameValueObject } from '@contexts/tasks/domain/value-objects/task-name/task-name.value-object';
import { TaskPayloadValueObject } from '@contexts/tasks/domain/value-objects/task-payload/task-payload.value-object';
import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskQueueJobIdValueObject } from '@contexts/tasks/domain/value-objects/task-queue-job-id/task-queue-job-id.value-object';
import { TaskRunCountValueObject } from '@contexts/tasks/domain/value-objects/task-run-count/task-run-count.value-object';
import { TaskStatusValueObject } from '@contexts/tasks/domain/value-objects/task-status/task-status.value-object';
import { TaskTargetIdValueObject } from '@contexts/tasks/domain/value-objects/task-target-id/task-target-id.value-object';
import { TaskTargetTypeValueObject } from '@contexts/tasks/domain/value-objects/task-target-type/task-target-type.value-object';
import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';
import { TaskTriggerTypeValueObject } from '@contexts/tasks/domain/value-objects/task-trigger-type/task-trigger-type.value-object';

export class TaskAggregate extends BaseAggregate {
  private readonly _id: TaskIdValueObject;
  private readonly _templateId: TaskTemplateIdValueObject | null;
  private readonly _triggerType: TaskTriggerTypeValueObject;
  private readonly _title: TaskNameValueObject | null;
  private readonly _description: TaskDescriptionValueObject | null;
  private _status: TaskStatusValueObject;
  private readonly _payload: TaskPayloadValueObject;
  private readonly _priority: TaskPriorityValueObject;
  private readonly _delayMs: TaskDelayMsValueObject | null;
  private readonly _cronExpression: TaskCronExpressionValueObject | null;
  private readonly _isRecurring: TaskIsRecurringValueObject;
  private readonly _maxRuns: TaskMaxRunsValueObject | null;
  private _runCount: TaskRunCountValueObject;
  private readonly _idempotencyKey: TaskIdempotencyKeyValueObject | null;
  private _queueJobId: TaskQueueJobIdValueObject | null;
  private readonly _userId: UuidValueObject;
  private readonly _targetType: TaskTargetTypeValueObject | null;
  private readonly _targetId: TaskTargetIdValueObject | null;
  private readonly _validFrom: DateValueObject | null;
  private readonly _validUntil: DateValueObject | null;
  private _scheduledAt: DateValueObject | null;
  private _startedAt: DateValueObject | null;
  private _completedAt: DateValueObject | null;
  private _failedAt: DateValueObject | null;
  private _cancelledAt: DateValueObject | null;

  constructor(props: ITask) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._templateId = props.templateId;
    this._triggerType = props.triggerType;
    this._title = props.title;
    this._description = props.description;
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
    this._targetType = props.targetType;
    this._targetId = props.targetId;
    this._validFrom = props.validFrom;
    this._validUntil = props.validUntil;
    this._scheduledAt = props.scheduledAt;
    this._startedAt = props.startedAt;
    this._completedAt = props.completedAt;
    this._failedAt = props.failedAt;
    this._cancelledAt = props.cancelledAt;
  }

  public schedule(): void {
    this._scheduledAt = new DateValueObject(new Date());
    this.apply(
      new TaskScheduledEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskAggregate.name,
          entityId: this._id.value,
          entityType: TaskAggregate.name,
          eventType: TaskScheduledEvent.name,
        },
        this.toEventData(),
      ),
    );
  }

  public setQueueJobId(queueJobId: TaskQueueJobIdValueObject): void {
    this._queueJobId = queueJobId;
    this.touch();
  }

  public start(): void {
    if (this._status.isTerminal()) return;
    this._status = new TaskStatusValueObject(TaskStatusEnum.ACTIVE);
    this._startedAt = new DateValueObject(new Date());
    this._runCount = new TaskRunCountValueObject(this._runCount.value + 1);
    this.touch();
    this.apply(
      new TaskStartedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskAggregate.name,
          entityId: this._id.value,
          entityType: TaskAggregate.name,
          eventType: TaskStartedEvent.name,
        },
        this.toEventData(),
      ),
    );
  }

  public complete(): void {
    if (this._status.isTerminal()) return;
    this._status = new TaskStatusValueObject(TaskStatusEnum.COMPLETED);
    this._completedAt = new DateValueObject(new Date());
    this.touch();
    this.apply(
      new TaskCompletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskAggregate.name,
          entityId: this._id.value,
          entityType: TaskAggregate.name,
          eventType: TaskCompletedEvent.name,
        },
        this.toEventData(),
      ),
    );
  }

  public completeByUser(today: Date): void {
    if (!this._triggerType.isUser()) {
      throw new TaskNotCompletableException(
        'only user-triggered tasks can be completed manually',
      );
    }
    if (this._status.isTerminal()) {
      throw new TaskNotCompletableException(
        `task is already ${this._status.value}`,
      );
    }
    if (this._scheduledAt !== null) {
      const scheduledDay = this.toDateOnly(this._scheduledAt.value);
      const todayDay = this.toDateOnly(today);
      if (scheduledDay > todayDay) {
        throw new TaskNotCompletableException(
          'task is scheduled for a future date',
        );
      }
    }
    this._status = new TaskStatusValueObject(TaskStatusEnum.COMPLETED);
    this._completedAt = new DateValueObject(new Date());
    this.touch();
    this.apply(
      new TaskCompletedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskAggregate.name,
          entityId: this._id.value,
          entityType: TaskAggregate.name,
          eventType: TaskCompletedEvent.name,
        },
        this.toEventData(),
      ),
    );
  }

  public reschedule(newDate: Date): void {
    if (!this._triggerType.isUser()) {
      throw new TaskNotReschedulableException(
        'only user-triggered tasks can be rescheduled',
      );
    }
    if (this._status.value !== TaskStatusEnum.PENDING) {
      throw new TaskNotReschedulableException(
        `task status is ${this._status.value}`,
      );
    }
    const oldScheduledAt = this._scheduledAt?.value ?? null;
    this._scheduledAt = new DateValueObject(newDate);
    this.touch();
    this.apply(
      new TaskRescheduledEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskAggregate.name,
          entityId: this._id.value,
          entityType: TaskAggregate.name,
          eventType: TaskRescheduledEvent.name,
        },
        {
          id: this._id.value,
          userId: this._userId.value,
          oldScheduledAt,
          newScheduledAt: newDate,
        },
      ),
    );
  }

  private toDateOnly(date: Date): number {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  }

  public fail(error: string): void {
    if (this._status.isTerminal()) return;
    this._status = new TaskStatusValueObject(TaskStatusEnum.FAILED);
    this._failedAt = new DateValueObject(new Date());
    this.touch();
    this.apply(
      new TaskFailedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskAggregate.name,
          entityId: this._id.value,
          entityType: TaskAggregate.name,
          eventType: TaskFailedEvent.name,
        },
        { ...this.toEventData(), error },
      ),
    );
  }

  public cancel(): void {
    if (this._status.value !== TaskStatusEnum.PENDING) {
      throw new TaskNotCancellableException(this._status.value);
    }
    this._status = new TaskStatusValueObject(TaskStatusEnum.CANCELLED);
    this._cancelledAt = new DateValueObject(new Date());
    this.touch();
    this.apply(
      new TaskCancelledEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskAggregate.name,
          entityId: this._id.value,
          entityType: TaskAggregate.name,
          eventType: TaskCancelledEvent.name,
        },
        this.toEventData(),
      ),
    );
  }

  public sendToDlq(error: string): void {
    if (this._status.isTerminal()) return;
    this._status = new TaskStatusValueObject(TaskStatusEnum.FAILED);
    this._failedAt = new DateValueObject(new Date());
    this.touch();
    this.apply(
      new TaskSentToDlqEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: TaskAggregate.name,
          entityId: this._id.value,
          entityType: TaskAggregate.name,
          eventType: TaskSentToDlqEvent.name,
        },
        { ...this.toEventData(), error },
      ),
    );
  }

  private toEventData() {
    return {
      id: this._id.value,
      templateId: this._templateId?.value ?? null,
      handlerKey: '',
      userId: this._userId.value,
      status: this._status.value,
    };
  }

  get id(): TaskIdValueObject {
    return this._id;
  }

  get templateId(): TaskTemplateIdValueObject | null {
    return this._templateId;
  }

  get triggerType(): TaskTriggerTypeValueObject {
    return this._triggerType;
  }

  get title(): TaskNameValueObject | null {
    return this._title;
  }

  get description(): TaskDescriptionValueObject | null {
    return this._description;
  }

  get status(): TaskStatusValueObject {
    return this._status;
  }

  get payload(): TaskPayloadValueObject {
    return this._payload;
  }

  get priority(): TaskPriorityValueObject {
    return this._priority;
  }

  get delayMs(): TaskDelayMsValueObject | null {
    return this._delayMs;
  }

  get cronExpression(): TaskCronExpressionValueObject | null {
    return this._cronExpression;
  }

  get isRecurring(): TaskIsRecurringValueObject {
    return this._isRecurring;
  }

  get maxRuns(): TaskMaxRunsValueObject | null {
    return this._maxRuns;
  }

  get runCount(): TaskRunCountValueObject {
    return this._runCount;
  }

  get idempotencyKey(): TaskIdempotencyKeyValueObject | null {
    return this._idempotencyKey;
  }

  get queueJobId(): TaskQueueJobIdValueObject | null {
    return this._queueJobId;
  }

  get userId(): UuidValueObject {
    return this._userId;
  }

  get targetType(): TaskTargetTypeValueObject | null {
    return this._targetType;
  }

  get targetId(): TaskTargetIdValueObject | null {
    return this._targetId;
  }

  get validFrom(): DateValueObject | null {
    return this._validFrom;
  }

  get validUntil(): DateValueObject | null {
    return this._validUntil;
  }

  get scheduledAt(): DateValueObject | null {
    return this._scheduledAt;
  }

  get startedAt(): DateValueObject | null {
    return this._startedAt;
  }

  get completedAt(): DateValueObject | null {
    return this._completedAt;
  }

  get failedAt(): DateValueObject | null {
    return this._failedAt;
  }

  get cancelledAt(): DateValueObject | null {
    return this._cancelledAt;
  }

  toPrimitives(): ITaskPrimitives {
    return {
      id: this._id.value,
      templateId: this._templateId?.value ?? null,
      triggerType: this._triggerType.value,
      title: this._title?.value ?? null,
      description: this._description?.value ?? null,
      status: this._status.value,
      payload: this._payload.value,
      priority: this._priority.value,
      delayMs: this._delayMs?.value ?? null,
      cronExpression: this._cronExpression?.value ?? null,
      isRecurring: this._isRecurring.value,
      maxRuns: this._maxRuns?.value ?? null,
      runCount: this._runCount.value,
      idempotencyKey: this._idempotencyKey?.value ?? null,
      queueJobId: this._queueJobId?.value ?? null,
      userId: this._userId.value,
      targetType: this._targetType?.value ?? null,
      targetId: this._targetId?.value ?? null,
      validFrom: this._validFrom?.value ?? null,
      validUntil: this._validUntil?.value ?? null,
      scheduledAt: this._scheduledAt?.value ?? null,
      startedAt: this._startedAt?.value ?? null,
      completedAt: this._completedAt?.value ?? null,
      failedAt: this._failedAt?.value ?? null,
      cancelledAt: this._cancelledAt?.value ?? null,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
