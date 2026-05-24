import { UserRoleEnum, UserStatusEnum } from '@sisques-labs/nestjs-kit';

export class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly role: UserRoleEnum,
    public readonly status: UserStatusEnum,
  ) {}
}
