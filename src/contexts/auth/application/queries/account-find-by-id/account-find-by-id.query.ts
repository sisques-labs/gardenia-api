import { IAccountPrimitives } from '@contexts/auth/domain/primitives/account.primitives';
import { AccountIdValueObject } from '@contexts/auth/domain/value-objects/account-id/account-id.vo';

export type AccountFindByIdQueryInput = Pick<IAccountPrimitives, 'id'>;

export class AccountFindByIdQuery {
  public readonly id: AccountIdValueObject;

  constructor(input: AccountFindByIdQueryInput) {
    this.id = new AccountIdValueObject(input.id);
  }
}
