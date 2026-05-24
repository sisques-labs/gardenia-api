import { IUser } from '@contexts/users/domain/interfaces/user.interface';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';

export type UserFindByIdQueryInput = Pick<IUser, 'id'>;

export class UserFindByIdQuery {
  public readonly id: UserIdValueObject;

  constructor(input: UserFindByIdQueryInput) {
    this.id = input.id;
  }
}
