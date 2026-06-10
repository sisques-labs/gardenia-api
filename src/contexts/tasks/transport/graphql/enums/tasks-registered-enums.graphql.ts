import { registerEnumType } from '@nestjs/graphql';

import { TaskBackoffStrategyEnum } from '@contexts/tasks/domain/enums/task-backoff-strategy.enum';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';
import { TaskTriggerTypeEnum } from '@contexts/tasks/domain/enums/task-trigger-type.enum';

registerEnumType(TaskStatusEnum, {
  name: 'TaskStatusEnum',
  description: 'Lifecycle status of a task',
});

registerEnumType(TaskBackoffStrategyEnum, {
  name: 'TaskBackoffStrategyEnum',
  description: 'Retry backoff strategy for a task template',
});

registerEnumType(TaskTriggerTypeEnum, {
  name: 'TaskTriggerTypeEnum',
  description: 'Who triggered the task: user or automated schedule',
});
