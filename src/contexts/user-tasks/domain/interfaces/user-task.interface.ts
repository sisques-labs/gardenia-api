import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { UserTaskCompletedAtValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-completed-at/user-task-completed-at.value-object';
import { UserTaskDescriptionValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-description/user-task-description.value-object';
import { UserTaskIdValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-id/user-task-id.value-object';
import { UserTaskScheduledDateValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-scheduled-date/user-task-scheduled-date.value-object';
import { UserTaskStatusValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-status/user-task-status.value-object';
import { UserTaskTitleValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-title/user-task-title.value-object';

export interface IUserTask {
  id: UserTaskIdValueObject;
  title: UserTaskTitleValueObject;
  description: UserTaskDescriptionValueObject | null;
  status: UserTaskStatusValueObject;
  scheduledDate: UserTaskScheduledDateValueObject;
  taskTemplateId: UuidValueObject | null;
  userId: UuidValueObject;
  completedAt: UserTaskCompletedAtValueObject | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
