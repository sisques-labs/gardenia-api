import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { IBaseWriteRepository } from '@sisques-labs/nestjs-kit';

export const ACCOUNT_WRITE_REPOSITORY = Symbol('ACCOUNT_WRITE_REPOSITORY');

export interface IAccountWriteRepository extends IBaseWriteRepository<AccountAggregate> {
  findByEmail(email: string): Promise<AccountAggregate | null>;
  findByUserId(userId: string): Promise<AccountAggregate | null>;
}
