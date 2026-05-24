import { IUser } from '@contexts/users/domain/interfaces/user.interface';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';
import { UserStatusValueObject } from '@contexts/users/domain/value-objects/user-status/user-status.vo';

export type UpdateUserCommandInput = Pick<IUser, 'id'> &
  Partial<Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>>;

export class UpdateUserCommand {
  public readonly id: UserIdValueObject;
  public readonly status?: UserStatusValueObject;

  constructor(input: UpdateUserCommandInput) {
    this.id = input.id;
    if (input.status !== undefined) {
      this.status = input.status;
    }
  }
}
