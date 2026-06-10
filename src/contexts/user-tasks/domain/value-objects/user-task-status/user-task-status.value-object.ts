import { EnumValueObject } from '@sisques-labs/nestjs-kit';

import { UserTaskStatusEnum } from '@contexts/user-tasks/domain/enums/user-task-status.enum';

export class UserTaskStatusValueObject extends EnumValueObject<
  typeof UserTaskStatusEnum
> {
  constructor(value: UserTaskStatusEnum) {
    super(value);
  }

  protected get enumObject(): typeof UserTaskStatusEnum {
    return UserTaskStatusEnum as unknown as typeof UserTaskStatusEnum;
  }

  isTerminal(): boolean {
    return (
      this.value === UserTaskStatusEnum.COMPLETED ||
      this.value === UserTaskStatusEnum.CANCELLED
    );
  }
}
