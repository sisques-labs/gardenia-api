import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';
import { UserStatusValueObject } from '@contexts/users/domain/value-objects/user-status/user-status.vo';
import { UsernameValueObject } from '@contexts/users/domain/value-objects/username/username.value-object';
import { DateValueObject } from '@sisques-labs/nestjs-kit';

// TODO: All with value objects
export interface IUser {
  id: UserIdValueObject;
  status: UserStatusValueObject;
  username: UsernameValueObject;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  locale: string | null;
  timezone: string | null;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
