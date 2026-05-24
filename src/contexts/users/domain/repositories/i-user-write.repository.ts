import { UserAggregate } from '../aggregates/user.aggregate';

export const USER_WRITE_REPOSITORY = Symbol('USER_WRITE_REPOSITORY');

export interface IUserWriteRepository {
  save(user: UserAggregate): Promise<void>;
  findById(id: string): Promise<UserAggregate | null>;
}
