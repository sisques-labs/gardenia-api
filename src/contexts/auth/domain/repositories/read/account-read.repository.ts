import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

export const ACCOUNT_READ_REPOSITORY = Symbol('ACCOUNT_READ_REPOSITORY');

export type IAccountReadRepository = IBaseReadRepository<AccountAggregate>;
