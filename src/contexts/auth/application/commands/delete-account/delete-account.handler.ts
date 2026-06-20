import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import {
  IUserProvisioningPort,
  USER_PROVISIONING_PORT,
} from '@contexts/auth/application/ports/user-provisioning.port';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import {
  AUTH_SESSION_WRITE_REPOSITORY,
  IAuthSessionWriteRepository,
} from '@contexts/auth/domain/repositories/write/auth-session-write.repository';
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
    @Inject(AUTH_SESSION_WRITE_REPOSITORY)
    private readonly authSessionRepo: IAuthSessionWriteRepository,
    @Inject(USER_PROVISIONING_PORT)
    private readonly userProvisioningPort: IUserProvisioningPort,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteAccountCommand): Promise<void> {
    const account = await this.accountWriteRepository.findByUserId(
      command.userId,
    );

    if (!account) throw new AccountNotFoundException(command.userId);

    await this.authSessionRepo.revokeAllByUserId(command.userId);

    account.delete();

    await this.accountWriteRepository.delete(account.id.value);
    // RISK: if user deprovisioning fails here, account row is gone but user row remains (same class as register flow — no compensation)
    await this.userProvisioningPort.deleteUser(account.userId.value);
    await this.publishEvents(account);
  }
}
