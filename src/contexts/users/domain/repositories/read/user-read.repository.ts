import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

export const USER_READ_REPOSITORY = Symbol('USER_READ_REPOSITORY');

export interface IUserReadRepository extends IBaseReadRepository<UserViewModel> {
  findByUsername(username: string): Promise<UserViewModel | null>;
}
