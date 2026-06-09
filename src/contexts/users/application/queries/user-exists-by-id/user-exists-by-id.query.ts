import { IUserPrimitives } from '@contexts/users/domain/primitives/user.primitives';

export type UserExistsByIdQueryInput = Pick<IUserPrimitives, 'id'>;

export class UserExistsByIdQuery {
  public readonly id: string;

  constructor(input: UserExistsByIdQueryInput) {
    this.id = input.id;
  }
}
