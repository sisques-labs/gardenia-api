import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { TERMINAL_TASK_STATUSES } from '@contexts/tasks/domain/constants/task-status.constants';
import { TaskStatusEnum } from '@contexts/tasks/domain/enums/task-status.enum';

export class TaskStatusValueObject extends EnumValueObject<
  typeof TaskStatusEnum
> {
  constructor(value: TaskStatusEnum) {
    super(value);
  }

  protected get enumObject(): typeof TaskStatusEnum {
    return TaskStatusEnum as unknown as typeof TaskStatusEnum;
  }

  isTerminal(): boolean {
    return TERMINAL_TASK_STATUSES.includes(this.value as TaskStatusEnum);
  }
}
