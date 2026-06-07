import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { TaskBackoffStrategyEnum } from '@contexts/tasks/domain/enums/task-backoff-strategy.enum';

export class TaskBackoffStrategyValueObject extends EnumValueObject<
  typeof TaskBackoffStrategyEnum
> {
  constructor(value: TaskBackoffStrategyEnum) {
    super(value);
  }

  protected get enumObject(): typeof TaskBackoffStrategyEnum {
    return TaskBackoffStrategyEnum as unknown as typeof TaskBackoffStrategyEnum;
  }
}
