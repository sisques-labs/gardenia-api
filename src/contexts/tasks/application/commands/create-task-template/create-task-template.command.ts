import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { TaskBackoffStrategyEnum } from '@contexts/tasks/domain/enums/task-backoff-strategy.enum';
import { TaskBackoffStrategyValueObject } from '@contexts/tasks/domain/value-objects/task-backoff-strategy/task-backoff-strategy.value-object';
import { TaskConcurrencyValueObject } from '@contexts/tasks/domain/value-objects/task-concurrency/task-concurrency.value-object';
import { TaskHandlerKeyValueObject } from '@contexts/tasks/domain/value-objects/task-handler-key/task-handler-key.value-object';
import { TaskNameValueObject } from '@contexts/tasks/domain/value-objects/task-name/task-name.value-object';
import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskRetryCountValueObject } from '@contexts/tasks/domain/value-objects/task-retry-count/task-retry-count.value-object';
import { TaskTimeoutValueObject } from '@contexts/tasks/domain/value-objects/task-timeout/task-timeout.value-object';

export interface CreateTaskTemplateCommandInput {
  name: string;
  description?: string | null;
  handlerKey: string;
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
  public readonly description: string | null;
  public readonly handlerKey: TaskHandlerKeyValueObject;
  public readonly defaultPriority: TaskPriorityValueObject;
  public readonly defaultRetryCount: TaskRetryCountValueObject;
  public readonly defaultBackoffStrategy: TaskBackoffStrategyValueObject;
  public readonly defaultTimeoutMs: TaskTimeoutValueObject;
  public readonly maxConcurrency: TaskConcurrencyValueObject;
  public readonly defaultCronExpression: string | null;
  public readonly defaultIsRecurring: boolean;
  public readonly userId: UuidValueObject;

  constructor(input: CreateTaskTemplateCommandInput) {
    this.name = new TaskNameValueObject(input.name);
    this.description = input.description ?? null;
    this.handlerKey = new TaskHandlerKeyValueObject(input.handlerKey);
    this.defaultPriority = new TaskPriorityValueObject(input.defaultPriority ?? 5);
    this.defaultRetryCount = new TaskRetryCountValueObject(input.defaultRetryCount ?? 3);
    this.defaultBackoffStrategy = new TaskBackoffStrategyValueObject(
      (input.defaultBackoffStrategy as TaskBackoffStrategyEnum) ?? TaskBackoffStrategyEnum.EXPONENTIAL,
    );
    this.defaultTimeoutMs = new TaskTimeoutValueObject(input.defaultTimeoutMs ?? 30000);
    this.maxConcurrency = new TaskConcurrencyValueObject(input.maxConcurrency ?? 5);
    this.defaultCronExpression = input.defaultCronExpression ?? null;
    this.defaultIsRecurring = input.defaultIsRecurring ?? false;
    this.userId = new UuidValueObject(input.userId);
  }
}
