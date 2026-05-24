import { IUserPrimitives } from '@contexts/users/domain/primitives/user.primitives';
import { BaseViewModel } from '@sisques-labs/nestjs-kit';

export class UserViewModel extends BaseViewModel {
  public readonly status: string;

  constructor(props: IUserPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.status = props.status;
  }
}
