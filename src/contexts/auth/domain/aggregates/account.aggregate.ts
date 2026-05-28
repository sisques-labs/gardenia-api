import { AccountCreatedEvent } from '@contexts/auth/domain/events/account-created/account-created.event';
import { AccountDeletedEvent } from '@contexts/auth/domain/events/account-deleted/account-deleted.event';
import { AccountPasswordChangedEvent } from '@contexts/auth/domain/events/field-changed/account-password-changed/account-password-changed.event';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';
import { IAccount } from '@contexts/auth/domain/interfaces/account.interface';
import { IAccountPrimitives } from '@contexts/auth/domain/primitives/account.primitives';
import { AccountEmailValueObject } from '@contexts/auth/domain/value-objects/account-email/account-email.vo';
import { AccountIdValueObject } from '@contexts/auth/domain/value-objects/account-id/account-id.vo';
import { AccountPasswordHashValueObject } from '@contexts/auth/domain/value-objects/account-password-hash/account-password-hash.vo';
import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';
import * as bcrypt from 'bcrypt';

export class AccountAggregate extends BaseAggregate {
  private readonly _id: AccountIdValueObject;
  private readonly _userId: UuidValueObject;
  private readonly _email: AccountEmailValueObject;
  private _passwordHash: AccountPasswordHashValueObject;

  constructor(props: IAccount) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._userId = props.userId;
    this._email = props.email;
    this._passwordHash = props.passwordHash;
  }

  public create(): void {
    this.apply(
      new AccountCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: AccountAggregate.name,
          entityId: this._id.value,
          entityType: AccountAggregate.name,
          eventType: AccountCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public changePassword(password: string): void {
    const oldPasswordHash = this.passwordHash.value;
    const newPasswordHash = new AccountPasswordHashValueObject(password);

    this._passwordHash = newPasswordHash;

    this.apply(
      new AccountPasswordChangedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: AccountAggregate.name,
          entityId: this.id.value,
          entityType: AccountAggregate.name,
          eventType: AccountPasswordChangedEvent.name,
        },
        {
          id: this.id.value,
          oldValue: oldPasswordHash,
          newValue: this.passwordHash.value,
        },
      ),
    );
  }

  public async changePasswordWithValidation(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const matches = await bcrypt.compare(
      currentPassword,
      this.passwordHash.value,
    );

    if (!matches) {
      throw new InvalidCredentialsException();
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    this.changePassword(hashedPassword);
  }

  public delete(): void {
    this.apply(
      new AccountDeletedEvent(
        {
          aggregateRootId: this.id.value,
          aggregateRootType: AccountAggregate.name,
          entityId: this.id.value,
          entityType: AccountAggregate.name,
          eventType: AccountDeletedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  get id(): AccountIdValueObject {
    return this._id;
  }

  get userId(): UuidValueObject {
    return this._userId;
  }

  get email(): AccountEmailValueObject {
    return this._email;
  }

  get passwordHash(): AccountPasswordHashValueObject {
    return this._passwordHash;
  }

  toPrimitives(): IAccountPrimitives {
    return {
      id: this._id.value,
      userId: this._userId.value,
      email: this._email.value,
      passwordHash: this._passwordHash.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }
}
