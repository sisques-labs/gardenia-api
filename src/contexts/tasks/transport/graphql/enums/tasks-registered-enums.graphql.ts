import { registerEnumType } from '@nestjs/graphql';

import { TaskBackoffStrategyEnum } from '@contexts/tasks/domain/enums/task-backoff-strategy.enum';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';

registerEnumType(TaskStatusEnum, {
  name: 'TaskStatusEnum',
  description: 'Lifecycle status of a task',
});

registerEnumType(TaskBackoffStrategyEnum, {
  name: 'TaskBackoffStrategyEnum',
  description: 'Retry backoff strategy for a task template',
});
