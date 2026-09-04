import { IAccountPrimitives } from '@contexts/auth/domain/primitives/account.primitives';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export type AccountFindByIdQueryInput = Pick<IAccountPrimitives, 'id'>;

export class AccountFindByIdQuery {
  public readonly id: UuidValueObject;

  constructor(input: AccountFindByIdQueryInput) {
    this.id = new UuidValueObject(input.id);
  }
}
