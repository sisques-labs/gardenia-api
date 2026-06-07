import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { TaskRunStatusEnum } from '@contexts/tasks/domain/enums/task-run-status.enum';

export class TaskRunStatusValueObject extends EnumValueObject<
  typeof TaskRunStatusEnum
> {
  constructor(value: TaskRunStatusEnum) {
    super(value);
  }

  protected get enumObject(): typeof TaskRunStatusEnum {
    return TaskRunStatusEnum as unknown as typeof TaskRunStatusEnum;
  }
}
