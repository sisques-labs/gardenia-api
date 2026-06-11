import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';

export const TERMINAL_TASK_STATUSES: TaskStatusEnum[] = [
  TaskStatusEnum.COMPLETED,
  TaskStatusEnum.FAILED,
  TaskStatusEnum.CANCELLED,
];
