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
import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';
import { TaskTimeoutValueObject } from '@contexts/tasks/domain/value-objects/task-timeout/task-timeout.value-object';

export interface UpdateTaskTemplateCommandInput {
  id: string;
  name?: string;
  description?: string | null;
  handlerKey?: string;
  defaultPriority?: number;
  defaultRetryCount?: number;
  defaultBackoffStrategy?: string;
  defaultTimeoutMs?: number;
  maxConcurrency?: number;
  defaultCronExpression?: string | null;
  defaultIsRecurring?: boolean;
}

export class UpdateTaskTemplateCommand {
  public readonly id: TaskTemplateIdValueObject;
  public readonly name?: TaskNameValueObject;
  public readonly description?: TaskDescriptionValueObject | null;
  public readonly handlerKey?: TaskHandlerKeyValueObject;
  public readonly defaultPriority?: TaskPriorityValueObject;
  public readonly defaultRetryCount?: TaskRetryCountValueObject;
  public readonly defaultBackoffStrategy?: TaskBackoffStrategyValueObject;
  public readonly defaultTimeoutMs?: TaskTimeoutValueObject;
  public readonly maxConcurrency?: TaskConcurrencyValueObject;
  public readonly defaultCronExpression?: TaskCronExpressionValueObject | null;
  public readonly defaultIsRecurring?: TaskIsRecurringValueObject;

  constructor(input: UpdateTaskTemplateCommandInput) {
    this.id = new TaskTemplateIdValueObject(input.id);
    if (input.name !== undefined)
      this.name = new TaskNameValueObject(input.name);
    if (input.description !== undefined) {
      this.description = input.description
        ? new TaskDescriptionValueObject(input.description)
        : null;
    }
    if (input.handlerKey !== undefined) {
      this.handlerKey = new TaskHandlerKeyValueObject(input.handlerKey);
    }
    if (input.defaultPriority !== undefined) {
      this.defaultPriority = new TaskPriorityValueObject(input.defaultPriority);
    }
    if (input.defaultRetryCount !== undefined) {
      this.defaultRetryCount = new TaskRetryCountValueObject(
        input.defaultRetryCount,
      );
    }
    if (input.defaultBackoffStrategy !== undefined) {
      this.defaultBackoffStrategy = new TaskBackoffStrategyValueObject(
        input.defaultBackoffStrategy as TaskBackoffStrategyEnum,
      );
    }
    if (input.defaultTimeoutMs !== undefined) {
      this.defaultTimeoutMs = new TaskTimeoutValueObject(
        input.defaultTimeoutMs,
      );
    }
    if (input.maxConcurrency !== undefined) {
      this.maxConcurrency = new TaskConcurrencyValueObject(
        input.maxConcurrency,
      );
    }
    if (input.defaultCronExpression !== undefined) {
      this.defaultCronExpression = input.defaultCronExpression
        ? new TaskCronExpressionValueObject(input.defaultCronExpression)
        : null;
    }
    if (input.defaultIsRecurring !== undefined) {
      this.defaultIsRecurring = new TaskIsRecurringValueObject(
        input.defaultIsRecurring,
      );
    }
  }
}
