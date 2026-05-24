import { AccountAggregate } from '../aggregates/account.aggregate';

export const ACCOUNT_WRITE_REPOSITORY = Symbol('ACCOUNT_WRITE_REPOSITORY');

export interface IAccountWriteRepository {
  save(account: AccountAggregate): Promise<void>;
  findByEmail(email: string): Promise<AccountAggregate | null>;
  findByUserId(userId: string): Promise<AccountAggregate | null>;
}
