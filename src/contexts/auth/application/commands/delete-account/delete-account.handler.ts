import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { DeleteUserCommand } from '@contexts/users/application/commands/delete-user/delete-user.command';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { Inject } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

@CommandHandler(DeleteAccountCommand)
export class DeleteAccountCommandHandler
  extends BaseCommandHandler<DeleteAccountCommand, AccountAggregate>
  implements ICommandHandler<DeleteAccountCommand>
{
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
    private readonly commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteAccountCommand): Promise<void> {
    const account = await this.accountWriteRepository.findByUserId(
      command.userId,
    );

    if (!account) throw new AccountNotFoundException(command.userId);

    account.delete();

    await this.accountWriteRepository.delete(account.id.value);
    // RISK: if DeleteUserCommand fails here, account row is gone but user row remains (same class as register flow — no compensation)
    await this.commandBus.execute(
      new DeleteUserCommand({ id: account.userId.value }),
    );
    await this.publishEvents(account);
    // TODO(#17): revoke JWT on account deletion
  }
}
