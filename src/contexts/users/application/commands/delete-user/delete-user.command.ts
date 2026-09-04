import { IUserPrimitives } from '@contexts/users/domain/primitives/user.primitives';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type DeleteUserCommandInput = Pick<IUserPrimitives, 'id'>;

export class DeleteUserCommand {
  public readonly id: UuidValueObject;
  constructor(input: DeleteUserCommandInput) {
    this.id = new UuidValueObject(input.id);
  }
}
