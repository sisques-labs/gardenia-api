import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';

export class EnsureUserExistsCommand {
  public readonly id: UserIdValueObject;

  constructor(userId: string) {
    this.id = new UserIdValueObject(userId);
  }
}
