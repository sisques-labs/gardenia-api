import { TaskRunViewModel } from '@contexts/tasks/domain/view-models/task-run.view-model';

export const TASK_RUN_READ_REPOSITORY = Symbol('TASK_RUN_READ_REPOSITORY');

export interface ITaskRunReadRepository {
  findByTaskId(taskId: string): Promise<TaskRunViewModel[]>;
}
