import { registerEnumType } from '@nestjs/graphql';

import { UserTaskStatusEnum } from '@contexts/user-tasks/domain/enums/user-task-status.enum';

registerEnumType(UserTaskStatusEnum, {
  name: 'UserTaskStatusEnum',
  description: 'Lifecycle status of a user task',
});
