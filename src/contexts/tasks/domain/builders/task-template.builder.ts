import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { TaskTemplateAggregate } from '@contexts/tasks/domain/aggregates/task-template.aggregate';
import { TaskBackoffStrategyEnum } from '@contexts/tasks/domain/enums/task-backoff-strategy.enum';
import { TaskTemplateViewModel } from '@contexts/tasks/domain/view-models/task-template.view-model';
import { TaskBackoffStrategyValueObject } from '@contexts/tasks/domain/value-objects/task-backoff-strategy/task-backoff-strategy.value-object';
import { TaskConcurrencyValueObject } from '@contexts/tasks/domain/value-objects/task-concurrency/task-concurrency.value-object';
import { TaskCronExpressionValueObject } from '@contexts/tasks/domain/value-objects/task-cron-expression/task-cron-expression.value-object';
import { TaskDescriptionValueObject } from '@contexts/tasks/domain/value-objects/task-description/task-description.value-object';
import { TaskHandlerKeyValueObject } from '@contexts/tasks/domain/value-objects/task-handler-key/task-handler-key.value-object';
import { TaskIsRecurringValueObject } from '@contexts/tasks/domain/value-objects/task-is-recurring/task-is-recurring.value-object';
import { TaskNameValueObject } from '@contexts/tasks/domain/value-objects/task-name/task-name.value-object';
import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskRetryCountValueObject } from '@contexts/tasks/domain/value-objects/task-retry-count/task-retry-count.value-object';
import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';
import { TaskTimeoutValueObject } from '@contexts/tasks/domain/value-objects/task-timeout/task-timeout.value-object';

@Injectable()
export class TaskTemplateBuilder extends BaseBuilder<
  TaskTemplateAggregate,
  TaskTemplateViewModel
> {
  private _name!: string;
  private _description: string | null = null;
  private _handlerKey!: string;
  private _defaultPriority: number = 5;
  private _defaultRetryCount: number = 3;
  private _defaultBackoffStrategy: string = TaskBackoffStrategyEnum.EXPONENTIAL;
  private _defaultTimeoutMs: number = 30000;
  private _maxConcurrency: number = 5;
  private _defaultCronExpression: string | null = null;
  private _defaultIsRecurring: boolean = false;
  private _userId!: string;

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withDescription(description: string | null): this {
    this._description = description;
    return this;
  }

  withHandlerKey(handlerKey: string): this {
    this._handlerKey = handlerKey;
    return this;
  }

  withDefaultPriority(priority: number): this {
    this._defaultPriority = priority;
    return this;
  }

  withDefaultRetryCount(retryCount: number): this {
    this._defaultRetryCount = retryCount;
    return this;
  }

  withDefaultBackoffStrategy(strategy: string): this {
    this._defaultBackoffStrategy = strategy;
    return this;
  }

  withDefaultTimeoutMs(timeoutMs: number): this {
    this._defaultTimeoutMs = timeoutMs;
    return this;
  }

  withMaxConcurrency(concurrency: number): this {
    this._maxConcurrency = concurrency;
    return this;
  }

  withDefaultCronExpression(cronExpression: string | null): this {
    this._defaultCronExpression = cronExpression;
    return this;
  }

  withDefaultIsRecurring(isRecurring: boolean): this {
    this._defaultIsRecurring = isRecurring;
    return this;
  }

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  public override validate(): void {
    super.validate();
    if (!this._name) throw new FieldIsRequiredException('name');
    if (!this._handlerKey) throw new FieldIsRequiredException('handlerKey');
    if (!this._userId) throw new FieldIsRequiredException('userId');
  }

  public override build(): TaskTemplateAggregate {
    this.validate();
    const now = new Date();
    return new TaskTemplateAggregate({
      id: new TaskTemplateIdValueObject(this._id),
      name: new TaskNameValueObject(this._name),
      description: this._description
        ? new TaskDescriptionValueObject(this._description)
        : null,
      handlerKey: new TaskHandlerKeyValueObject(this._handlerKey),
      defaultPriority: new TaskPriorityValueObject(this._defaultPriority),
      defaultRetryCount: new TaskRetryCountValueObject(this._defaultRetryCount),
      defaultBackoffStrategy: new TaskBackoffStrategyValueObject(
        this._defaultBackoffStrategy as TaskBackoffStrategyEnum,
      ),
      defaultTimeoutMs: new TaskTimeoutValueObject(this._defaultTimeoutMs),
      maxConcurrency: new TaskConcurrencyValueObject(this._maxConcurrency),
      defaultCronExpression: this._defaultCronExpression
        ? new TaskCronExpressionValueObject(this._defaultCronExpression)
        : null,
      defaultIsRecurring: new TaskIsRecurringValueObject(
        this._defaultIsRecurring,
      ),
      userId: new UuidValueObject(this._userId),
      createdAt: new DateValueObject(this._createdAt ?? now),
      updatedAt: new DateValueObject(this._updatedAt ?? now),
    });
  }

  public override buildViewModel(): TaskTemplateViewModel {
    this.validate();
    const now = new Date();
    return new TaskTemplateViewModel({
      id: this._id,
      name: this._name,
      description: this._description,
      handlerKey: this._handlerKey,
      defaultPriority: this._defaultPriority,
      defaultRetryCount: this._defaultRetryCount,
      defaultBackoffStrategy: this._defaultBackoffStrategy,
      defaultTimeoutMs: this._defaultTimeoutMs,
      maxConcurrency: this._maxConcurrency,
      defaultCronExpression: this._defaultCronExpression,
      defaultIsRecurring: this._defaultIsRecurring,
      userId: this._userId,
      createdAt: this._createdAt ?? now,
      updatedAt: this._updatedAt ?? now,
    });
  }
}
