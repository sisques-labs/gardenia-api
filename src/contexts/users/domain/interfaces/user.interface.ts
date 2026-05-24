import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';
import { UserStatusValueObject } from '@contexts/users/domain/value-objects/user-status/user-status.vo';
import { DateValueObject } from '@sisques-labs/nestjs-kit';

export interface IUser {
  id: UserIdValueObject;
  status: UserStatusValueObject;
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}
