import { IUserPrimitives } from '@contexts/users/domain/primitives/user.primitives';
import { UserIdValueObject } from '@contexts/users/domain/value-objects/user-id/user-id.value-object';
import { UserStatusValueObject } from '@contexts/users/domain/value-objects/user-status/user-status.vo';
import { UsernameValueObject } from '@contexts/users/domain/value-objects/username/username.value-object';
import { UserStatusEnum } from '@sisques-labs/nestjs-kit';

export type UpdateUserCommandInput = Pick<IUserPrimitives, 'id'> &
  Partial<Omit<IUserPrimitives, 'id' | 'createdAt' | 'updatedAt'>>;

export class UpdateUserCommand {
  public readonly id: UserIdValueObject;
  public readonly status?: UserStatusValueObject;
  public readonly username?: UsernameValueObject;
  public readonly firstName?: string | null;
  public readonly lastName?: string | null;
  public readonly avatarUrl?: string | null;
  public readonly bio?: string | null;
  public readonly locale?: string | null;
  public readonly timezone?: string | null;

  constructor(input: UpdateUserCommandInput) {
    this.id = new UserIdValueObject(input.id);
    if (input.status !== undefined) {
      this.status = new UserStatusValueObject(input.status as UserStatusEnum);
    }
    if (input.username !== undefined) {
      this.username = new UsernameValueObject(input.username);
    }
    if (input.firstName !== undefined) {
      this.firstName = input.firstName;
    }
    if (input.lastName !== undefined) {
      this.lastName = input.lastName;
    }
    if (input.avatarUrl !== undefined) {
      this.avatarUrl = input.avatarUrl;
    }
    if (input.bio !== undefined) {
      this.bio = input.bio;
    }
    if (input.locale !== undefined) {
      this.locale = input.locale;
    }
    if (input.timezone !== undefined) {
      this.timezone = input.timezone;
    }
  }
}
