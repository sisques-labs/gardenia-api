import { ChangePasswordCommand } from '@contexts/auth/application/commands/change-password/change-password.command';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';
import * as bcrypt from 'bcrypt';

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordCommandHandler
  extends BaseCommandHandler<ChangePasswordCommand, AccountAggregate>
  implements ICommandHandler<ChangePasswordCommand>
{
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: ChangePasswordCommand): Promise<void> {
    const account = await this.accountWriteRepository.findByUserId(
      command.userId,
    );

    if (!account) {
      throw new AccountNotFoundException(command.userId);
    }

    const matches = await bcrypt.compare(
      command.currentPassword,
      account.passwordHash.value,
    );

    account.assertCurrentPasswordMatches(matches);

    const hashed = await bcrypt.hash(command.newPassword, 10);

    account.changePassword(hashed);

    await this.accountWriteRepository.save(account);

    await this.publishEvents(account);
  }
}
