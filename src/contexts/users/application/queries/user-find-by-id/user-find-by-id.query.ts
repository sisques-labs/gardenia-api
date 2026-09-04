import { IUserPrimitives } from '@contexts/users/domain/primitives/user.primitives';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type UserFindByIdQueryInput = Pick<IUserPrimitives, 'id'>;

export class UserFindByIdQuery {
  public readonly id: UuidValueObject;

  constructor(input: UserFindByIdQueryInput) {
    this.id = new UuidValueObject(input.id);
  }
}
