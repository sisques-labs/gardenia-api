import { IUserPrimitives } from '@contexts/users/domain/primitives/user.primitives';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';

export type DeleteUserCommandInput = Pick<IUserPrimitives, 'id'>;

export class DeleteUserCommand {
  public readonly id: UserIdValueObject;
  constructor(input: DeleteUserCommandInput) {
    this.id = new UserIdValueObject(input.id);
  }
}
