import { IAccountPrimitives } from '@contexts/auth/domain/primitives/account.primitives';
import { BaseViewModel } from '@sisques-labs/nestjs-kit';

export class AccountViewModel extends BaseViewModel {
  public readonly userId: string;
  public readonly email: string;

  constructor(props: Omit<IAccountPrimitives, 'passwordHash'>) {
    super(props.id, props.createdAt, props.updatedAt);
    this.userId = props.userId;
    this.email = props.email;
  }
}
