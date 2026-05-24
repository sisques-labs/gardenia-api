import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { IBaseReadRepository } from '@sisques-labs/nestjs-kit';

export const ACCOUNT_READ_REPOSITORY = Symbol('ACCOUNT_READ_REPOSITORY');

export type IAccountReadRepository = IBaseReadRepository<AccountViewModel>;
