import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { TaskBackoffStrategyValueObject } from '@contexts/tasks/domain/value-objects/task-backoff-strategy/task-backoff-strategy.value-object';
import { TaskConcurrencyValueObject } from '@contexts/tasks/domain/value-objects/task-concurrency/task-concurrency.value-object';
import { TaskHandlerKeyValueObject } from '@contexts/tasks/domain/value-objects/task-handler-key/task-handler-key.value-object';
import { TaskNameValueObject } from '@contexts/tasks/domain/value-objects/task-name/task-name.value-object';
import { TaskPriorityValueObject } from '@contexts/tasks/domain/value-objects/task-priority/task-priority.value-object';
import { TaskRetryCountValueObject } from '@contexts/tasks/domain/value-objects/task-retry-count/task-retry-count.value-object';
import { TaskTemplateIdValueObject } from '@contexts/tasks/domain/value-objects/task-template-id/task-template-id.value-object';
import { TaskTimeoutValueObject } from '@contexts/tasks/domain/value-objects/task-timeout/task-timeout.value-object';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface ITaskTemplate {
  id: TaskTemplateIdValueObject;
  name: TaskNameValueObject;
  description: string | null;
  handlerKey: TaskHandlerKeyValueObject;
  defaultPriority: TaskPriorityValueObject;
  defaultRetryCount: TaskRetryCountValueObject;
  defaultBackoffStrategy: TaskBackoffStrategyValueObject;
  defaultTimeoutMs: TaskTimeoutValueObject;
  maxConcurrency: TaskConcurrencyValueObject;
  defaultCronExpression: string | null;
  defaultIsRecurring: boolean;
  userId: UuidValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
