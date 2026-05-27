import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

@CommandHandler(DeleteAccountCommand)
export class DeleteAccountCommandHandler
  extends BaseCommandHandler<DeleteAccountCommand, AccountAggregate>
  implements ICommandHandler<DeleteAccountCommand>
{
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteAccountCommand): Promise<void> {
    const account = await this.accountWriteRepository.findByUserId(
      command.userId,
    );

    if (account) {
      await this.accountWriteRepository.delete(account.id.value);
    }
  }
}
