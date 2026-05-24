import { IUserPrimitives } from '@contexts/users/domain/primitives/user.primitives';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';

export type UserFindByIdQueryInput = Pick<IUserPrimitives, 'id'>;

export class UserFindByIdQuery {
  public readonly id: UserIdValueObject;

  constructor(input: UserFindByIdQueryInput) {
    this.id = new UserIdValueObject(input.id);
  }
}
