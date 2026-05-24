import { IUser } from '@contexts/users/domain/interfaces/user.interface';
import { UserStatusValueObject } from '@contexts/users/domain/value-objects/user-status/user-status.vo';

export type CreateUserCommandInput = Omit<
  IUser,
  'id' | 'createdAt' | 'updatedAt'
>;

export class CreateUserCommand {
  public readonly status: UserStatusValueObject;

  constructor(input: CreateUserCommandInput) {
    this.status = input.status;
  }
}
