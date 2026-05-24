import { UserRoleEnum, UserStatusEnum } from '@sisques-labs/nestjs-kit';

export const USER_READ_REPOSITORY = Symbol('USER_READ_REPOSITORY');

export interface UserViewModel {
  id: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
  email?: string;
  createdAt: Date;
}

export interface IUserReadRepository {
  findById(id: string): Promise<UserViewModel | null>;
}
