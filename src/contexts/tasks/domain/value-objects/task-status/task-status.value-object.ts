import { EnumValueObject } from '@sisques-labs/nestjs-kit';

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
}
