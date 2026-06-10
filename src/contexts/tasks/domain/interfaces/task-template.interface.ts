import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

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

export interface ITaskTemplate {
  id: TaskTemplateIdValueObject;
  name: TaskNameValueObject;
  description: TaskDescriptionValueObject | null;
  handlerKey: TaskHandlerKeyValueObject | null;
  defaultPriority: TaskPriorityValueObject;
  defaultRetryCount: TaskRetryCountValueObject;
  defaultBackoffStrategy: TaskBackoffStrategyValueObject;
  defaultTimeoutMs: TaskTimeoutValueObject;
  maxConcurrency: TaskConcurrencyValueObject;
  defaultCronExpression: TaskCronExpressionValueObject | null;
  defaultIsRecurring: TaskIsRecurringValueObject;
  userId: UuidValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
