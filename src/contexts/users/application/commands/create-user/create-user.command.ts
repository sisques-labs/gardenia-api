import { IUserPrimitives } from '@contexts/users/domain/primitives/user.primitives';
import { UserStatusValueObject } from '@contexts/users/domain/value-objects/user-status/user-status.vo';
import { UserStatusEnum } from '@sisques-labs/nestjs-kit';

export type CreateUserCommandInput = Omit<
  IUserPrimitives,
  'id' | 'createdAt' | 'updatedAt'
>;

export class CreateUserCommand {
  public readonly status: UserStatusValueObject;

  constructor(input: CreateUserCommandInput) {
    this.status = new UserStatusValueObject(input.status as UserStatusEnum);
  }
}
