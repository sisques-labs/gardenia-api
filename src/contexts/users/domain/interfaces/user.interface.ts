import { UserStatusValueObject } from '@contexts/users/domain/value-objects/user-status/user-status.vo';
import { UsernameValueObject } from '@contexts/users/domain/value-objects/username/username.value-object';
import { IBaseAggregate } from '@sisques-labs/nestjs-kit';
// TODO: All with value objects
export interface IUser extends IBaseAggregate {
  status: UserStatusValueObject;
  username: UsernameValueObject;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locale: string | null;
  timezone: string | null;
}
