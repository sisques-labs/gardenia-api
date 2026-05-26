import { IUserPrimitives } from '@contexts/users/domain/primitives/user.primitives';
import { UserStatusValueObject } from '@contexts/users/domain/value-objects/user-status/user-status.vo';
import { UsernameValueObject } from '@contexts/users/domain/value-objects/username/username.value-object';
import { UserStatusEnum } from '@sisques-labs/nestjs-kit';

export type CreateUserCommandInput = Omit<
  IUserPrimitives,
  'id' | 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'avatarUrl' | 'bio' | 'locale' | 'timezone'
> & {
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  locale?: string | null;
  timezone?: string | null;
};

export class CreateUserCommand {
  public readonly status: UserStatusValueObject;
  public readonly username: UsernameValueObject;
  public readonly firstName: string | null;
  public readonly lastName: string | null;
  public readonly avatarUrl: string | null;
  public readonly bio: string | null;
  public readonly locale: string | null;
  public readonly timezone: string | null;

  constructor(input: CreateUserCommandInput) {
    this.status = new UserStatusValueObject(input.status as UserStatusEnum);
    this.username = new UsernameValueObject(input.username);
    this.firstName = input.firstName ?? null;
    this.lastName = input.lastName ?? null;
    this.avatarUrl = input.avatarUrl ?? null;
    this.bio = input.bio ?? null;
    this.locale = input.locale ?? null;
    this.timezone = input.timezone ?? null;
  }
}
