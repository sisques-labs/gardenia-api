import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { TaskIdValueObject } from '@contexts/tasks/domain/value-objects/task-id/task-id.value-object';
import { TaskRunAttemptValueObject } from '@contexts/tasks/domain/value-objects/task-run-attempt/task-run-attempt.value-object';
import { TaskRunErrorValueObject } from '@contexts/tasks/domain/value-objects/task-run-error/task-run-error.value-object';
import { TaskRunIdValueObject } from '@contexts/tasks/domain/value-objects/task-run-id/task-run-id.value-object';
import { TaskRunProgressValueObject } from '@contexts/tasks/domain/value-objects/task-run-progress/task-run-progress.value-object';
import { TaskRunStatusValueObject } from '@contexts/tasks/domain/value-objects/task-run-status/task-run-status.value-object';

export interface ITaskRun {
  id: TaskRunIdValueObject;
  taskId: TaskIdValueObject;
  attempt: TaskRunAttemptValueObject;
  status: TaskRunStatusValueObject;
  progress: TaskRunProgressValueObject;
  error: TaskRunErrorValueObject | null;
  startedAt: DateValueObject;
  endedAt: DateValueObject | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
