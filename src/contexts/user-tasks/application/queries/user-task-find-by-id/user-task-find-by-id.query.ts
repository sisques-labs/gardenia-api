import { UserTaskIdValueObject } from '@contexts/user-tasks/domain/value-objects/user-task-id/user-task-id.value-object';

export class UserTaskFindByIdQuery {
  public readonly id: UserTaskIdValueObject;

  constructor(id: string) {
    this.id = new UserTaskIdValueObject(id);
  }
}
