import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { TaskTriggerTypeEnum } from '@contexts/tasks/domain/enums/task-trigger-type.enum';

export class TaskTriggerTypeValueObject extends EnumValueObject<
  typeof TaskTriggerTypeEnum
> {
  constructor(value: TaskTriggerTypeEnum) {
    super(value);
  }

  protected get enumObject(): typeof TaskTriggerTypeEnum {
    return TaskTriggerTypeEnum as unknown as typeof TaskTriggerTypeEnum;
  }

  isUser(): boolean {
    return this.value === TaskTriggerTypeEnum.USER;
  }
}
