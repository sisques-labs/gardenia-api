import { IUserPrimitives } from '@contexts/users/domain/primitives/user.primitives';
import { BaseViewModel } from '@sisques-labs/nestjs-kit';

export class UserViewModel extends BaseViewModel {
  public readonly status: string;
  public readonly username: string;
  public readonly firstName: string | null;
  public readonly lastName: string | null;
  public readonly avatarUrl: string | null;
  public readonly bio: string | null;
  public readonly locale: string | null;
  public readonly timezone: string | null;

  constructor(props: IUserPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.status = props.status;
    this.username = props.username;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.avatarUrl = props.avatarUrl;
    this.bio = props.bio;
    this.locale = props.locale;
    this.timezone = props.timezone;
  }
}
