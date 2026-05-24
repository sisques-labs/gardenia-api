import { IUser } from '@contexts/users/domain/interfaces/user.interface';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';

export type DeleteUserCommandInput = Pick<IUser, 'id'>;

export class DeleteUserCommand {
  public readonly id: UserIdValueObject;
  constructor(input: DeleteUserCommandInput) {
    this.id = input.id;
  }
}
