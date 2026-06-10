import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { TaskAggregate } from '@contexts/tasks/domain/aggregates/task.aggregate';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { TaskTriggerTypeEnum } from '@contexts/tasks/domain/enums/task-trigger-type.enum';
import { TaskViewModel } from '@contexts/tasks/domain/view-models/task.view-model';
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

@Injectable()
export class TaskBuilder extends BaseBuilder<TaskAggregate, TaskViewModel> {
  private _templateId: string | null = null;
  private _triggerType: string = TaskTriggerTypeEnum.SCHEDULED;
  private _title: string | null = null;
  private _description: string | null = null;
  private _status: string = TaskStatusEnum.PENDING;
  private _payload: Record<string, unknown> = {};
  private _priority: number = 5;
  private _delayMs: number | null = null;
  private _cronExpression: string | null = null;
  private _isRecurring: boolean = false;
  private _maxRuns: number | null = null;
  private _runCount: number = 0;
  private _idempotencyKey: string | null = null;
  private _queueJobId: string | null = null;
  private _userId!: string;
  private _targetType: string | null = null;
  private _targetId: string | null = null;
  private _validFrom: Date | null = null;
  private _validUntil: Date | null = null;
  private _scheduledAt: Date | null = null;
  private _startedAt: Date | null = null;
  private _completedAt: Date | null = null;
  private _failedAt: Date | null = null;
  private _cancelledAt: Date | null = null;

  withTemplateId(templateId: string | null): this {
    this._templateId = templateId;
    return this;
  }

  withTriggerType(triggerType: string): this {
    this._triggerType = triggerType;
    return this;
  }

  withTitle(title: string | null): this {
    this._title = title;
    return this;
  }

  withDescription(description: string | null): this {
    this._description = description;
    return this;
  }

  withStatus(status: string): this {
    this._status = status;
    return this;
  }

  withPayload(payload: Record<string, unknown>): this {
    this._payload = payload;
    return this;
  }

  withPriority(priority: number): this {
    this._priority = priority;
    return this;
  }

  withDelayMs(delayMs: number | null): this {
    this._delayMs = delayMs;
    return this;
  }

  withCronExpression(cronExpression: string | null): this {
    this._cronExpression = cronExpression;
    return this;
  }

  withIsRecurring(isRecurring: boolean): this {
    this._isRecurring = isRecurring;
    return this;
  }

  withMaxRuns(maxRuns: number | null): this {
    this._maxRuns = maxRuns;
    return this;
  }

  withRunCount(runCount: number): this {
    this._runCount = runCount;
    return this;
  }

  withIdempotencyKey(key: string | null): this {
    this._idempotencyKey = key;
    return this;
  }

  withQueueJobId(queueJobId: string | null): this {
    this._queueJobId = queueJobId;
    return this;
  }

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withTargetType(targetType: string | null): this {
    this._targetType = targetType;
    return this;
  }

  withTargetId(targetId: string | null): this {
    this._targetId = targetId;
    return this;
  }

  withValidFrom(validFrom: Date | null): this {
    this._validFrom = validFrom;
    return this;
  }

  withValidUntil(validUntil: Date | null): this {
    this._validUntil = validUntil;
    return this;
  }

  withScheduledAt(scheduledAt: Date | null): this {
    this._scheduledAt = scheduledAt;
    return this;
  }

  withStartedAt(startedAt: Date | null): this {
    this._startedAt = startedAt;
    return this;
  }

  withCompletedAt(completedAt: Date | null): this {
    this._completedAt = completedAt;
    return this;
  }

  withFailedAt(failedAt: Date | null): this {
    this._failedAt = failedAt;
    return this;
  }

  withCancelledAt(cancelledAt: Date | null): this {
    this._cancelledAt = cancelledAt;
    return this;
  }

  public override validate(): void {
    super.validate();
    if (!this._userId) throw new FieldIsRequiredException('userId');
  }

  public override build(): TaskAggregate {
    this.validate();
    const now = new Date();
    return new TaskAggregate({
      id: new TaskIdValueObject(this._id),
      templateId: this._templateId
        ? new TaskTemplateIdValueObject(this._templateId)
        : null,
      triggerType: new TaskTriggerTypeValueObject(
        this._triggerType as TaskTriggerTypeEnum,
      ),
      title: this._title ? new TaskNameValueObject(this._title) : null,
      description: this._description
        ? new TaskDescriptionValueObject(this._description)
        : null,
      status: new TaskStatusValueObject(this._status as TaskStatusEnum),
      payload: new TaskPayloadValueObject(this._payload),
      priority: new TaskPriorityValueObject(this._priority),
      delayMs:
        this._delayMs != null
          ? new TaskDelayMsValueObject(this._delayMs)
          : null,
      cronExpression: this._cronExpression
        ? new TaskCronExpressionValueObject(this._cronExpression)
        : null,
      isRecurring: new TaskIsRecurringValueObject(this._isRecurring),
      maxRuns:
        this._maxRuns != null
          ? new TaskMaxRunsValueObject(this._maxRuns)
          : null,
      runCount: new TaskRunCountValueObject(this._runCount),
      idempotencyKey: this._idempotencyKey
        ? new TaskIdempotencyKeyValueObject(this._idempotencyKey)
        : null,
      queueJobId: this._queueJobId
        ? new TaskQueueJobIdValueObject(this._queueJobId)
        : null,
      userId: new UuidValueObject(this._userId),
      targetType: this._targetType
        ? new TaskTargetTypeValueObject(this._targetType)
        : null,
      targetId: this._targetId
        ? new TaskTargetIdValueObject(this._targetId)
        : null,
      validFrom: this._validFrom ? new DateValueObject(this._validFrom) : null,
      validUntil: this._validUntil
        ? new DateValueObject(this._validUntil)
        : null,
      scheduledAt: this._scheduledAt
        ? new DateValueObject(this._scheduledAt)
        : null,
      startedAt: this._startedAt ? new DateValueObject(this._startedAt) : null,
      completedAt: this._completedAt
        ? new DateValueObject(this._completedAt)
        : null,
      failedAt: this._failedAt ? new DateValueObject(this._failedAt) : null,
      cancelledAt: this._cancelledAt
        ? new DateValueObject(this._cancelledAt)
        : null,
      createdAt: new DateValueObject(this._createdAt ?? now),
      updatedAt: new DateValueObject(this._updatedAt ?? now),
    });
  }

  public override buildViewModel(): TaskViewModel {
    this.validate();
    const now = new Date();
    return new TaskViewModel({
      id: this._id,
      templateId: this._templateId,
      triggerType: this._triggerType,
      title: this._title,
      description: this._description,
      status: this._status,
      payload: this._payload,
      priority: this._priority,
      delayMs: this._delayMs,
      cronExpression: this._cronExpression,
      isRecurring: this._isRecurring,
      maxRuns: this._maxRuns,
      runCount: this._runCount,
      idempotencyKey: this._idempotencyKey,
      queueJobId: this._queueJobId,
      userId: this._userId,
      targetType: this._targetType,
      targetId: this._targetId,
      validFrom: this._validFrom,
      validUntil: this._validUntil,
      scheduledAt: this._scheduledAt,
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      failedAt: this._failedAt,
      cancelledAt: this._cancelledAt,
      createdAt: this._createdAt ?? now,
      updatedAt: this._updatedAt ?? now,
    });
  }
}
