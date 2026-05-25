import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { AccountCreatedEvent } from '@contexts/auth/domain/events/account-created/account-created.event';
import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { UserCreationFailedEvent } from '@contexts/users/domain/events/user-creation-failed/user-creation-failed.event';
import { Injectable } from '@nestjs/common';
import { ICommand, ofType, Saga } from '@nestjs/cqrs';
import { UserStatusEnum } from '@sisques-labs/nestjs-kit';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class RegisterAccountSaga {
  @Saga()
  onAccountCreated = (events$: Observable<any>): Observable<ICommand> =>
    events$.pipe(
      ofType(AccountCreatedEvent),
      map(
        (event: AccountCreatedEvent) =>
          new CreateUserCommand({
            id: event.data.userId,
            status: UserStatusEnum.ACTIVE,
          }),
      ),
    );

  @Saga()
  onUserCreationFailed = (events$: Observable<any>): Observable<ICommand> =>
    events$.pipe(
      ofType(UserCreationFailedEvent),
      map(
        (event: UserCreationFailedEvent) =>
          new DeleteAccountCommand(event.data.userId),
      ),
    );
}
