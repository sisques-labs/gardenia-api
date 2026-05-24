import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

export const USER_WRITE_REPOSITORY = Symbol('USER_WRITE_REPOSITORY');

export type IUserWriteRepository = IBaseWriteRepository<UserAggregate>;
