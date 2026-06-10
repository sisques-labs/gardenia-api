import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskBackoffStrategyEnum } from '@contexts/tasks/domain/enums/task-backoff-strategy.enum';
import { TaskBackoffStrategyValueObject } from '@contexts/tasks/domain/value-objects/task-backoff-strategy/task-backoff-strategy.value-object';
import { TaskConcurrencyValueObject } from '@contexts/tasks/domain/value-objects/task-concurrency/task-concurrency.value-object';
import { TaskCronExpressionValueObject } from '@contexts/tasks/domain/value-objects/task-cron-expression/task-cron-expression.value-object';
import { TaskDescriptionValueObject } from '@contexts/tasks/domain/value-objects/task-description/task-description.value-object';
import { TaskHandlerKeyValueObject } from '@contexts/tasks/domain/value-objects/task-handler-key/task-handler-key.value-object';
import { TaskIsRecurringValueObject } from '@contexts/tasks/domain/value-objects/task-is-recurring/task-is-recurring.value-object';
import { TaskNameValueObject } from '@contexts/tasks/domain/value-objects/task-name/task-name.value-object';
import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskRetryCountValueObject } from '@contexts/tasks/domain/value-objects/task-retry-count/task-retry-count.value-object';
import { TaskTimeoutValueObject } from '@contexts/tasks/domain/value-objects/task-timeout/task-timeout.value-object';

export interface CreateTaskTemplateCommandInput {
  name: string;
  description?: string | null;
  taskTitle?: string | null;
  taskDescription?: string | null;
  handlerKey?: string | null;
  defaultPriority?: number;
  defaultRetryCount?: number;
  defaultBackoffStrategy?: string;
  defaultTimeoutMs?: number;
  maxConcurrency?: number;
  defaultCronExpression?: string | null;
  defaultIsRecurring?: boolean;
  userId: string;
}

export class CreateTaskTemplateCommand {
  public readonly name: TaskNameValueObject;
  public readonly description: TaskDescriptionValueObject | null;
  public readonly taskTitle: TaskNameValueObject | null;
  public readonly taskDescription: TaskDescriptionValueObject | null;
  public readonly handlerKey: TaskHandlerKeyValueObject | null;
  public readonly defaultPriority: TaskPriorityValueObject;
  public readonly defaultRetryCount: TaskRetryCountValueObject;
  public readonly defaultBackoffStrategy: TaskBackoffStrategyValueObject;
  public readonly defaultTimeoutMs: TaskTimeoutValueObject;
  public readonly maxConcurrency: TaskConcurrencyValueObject;
  public readonly defaultCronExpression: TaskCronExpressionValueObject | null;
  public readonly defaultIsRecurring: TaskIsRecurringValueObject;
  public readonly userId: UuidValueObject;

  constructor(input: CreateTaskTemplateCommandInput) {
    this.name = new TaskNameValueObject(input.name);
    this.description = input.description
      ? new TaskDescriptionValueObject(input.description)
      : null;
    this.taskTitle = input.taskTitle
      ? new TaskNameValueObject(input.taskTitle)
      : null;
    this.taskDescription = input.taskDescription
      ? new TaskDescriptionValueObject(input.taskDescription)
      : null;
    this.handlerKey = TaskHandlerKeyValueObject.fromNullable(
      input.handlerKey ?? null,
    );
    this.defaultPriority = new TaskPriorityValueObject(
      input.defaultPriority ?? 5,
    );
    this.defaultRetryCount = new TaskRetryCountValueObject(
      input.defaultRetryCount ?? 3,
    );
    this.defaultBackoffStrategy = new TaskBackoffStrategyValueObject(
      (input.defaultBackoffStrategy as TaskBackoffStrategyEnum) ??
        TaskBackoffStrategyEnum.EXPONENTIAL,
    );
    this.defaultTimeoutMs = new TaskTimeoutValueObject(
      input.defaultTimeoutMs ?? 30000,
    );
    this.maxConcurrency = new TaskConcurrencyValueObject(
      input.maxConcurrency ?? 5,
    );
    this.defaultCronExpression = input.defaultCronExpression
      ? new TaskCronExpressionValueObject(input.defaultCronExpression)
      : null;
    this.defaultIsRecurring = new TaskIsRecurringValueObject(
      input.defaultIsRecurring ?? false,
    );
    this.userId = new UuidValueObject(input.userId);
  }
}
