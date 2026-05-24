import { IAccountPrimitives } from '@contexts/auth/domain/primitives/account.primitives';
import { BaseViewModel } from '@sisques-labs/nestjs-kit';

export class AccountViewModel extends BaseViewModel {
  public readonly userId: string;
  public readonly email: string;
  public readonly passwordHash: string;

  constructor(props: IAccountPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.userId = props.userId;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
  }
}
