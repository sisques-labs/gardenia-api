import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { LinkExternalSubjectCommand } from './link-external-subject.command';

/**
 * Links a platform (Sisques Account) subject to an existing local account by
 * verified email — the same auto-link-by-verified-email rule already applied
 * to native OAuth logins. Additive metadata only: never touches
 * `passwordHash` or `appRole`.
 */
@CommandHandler(LinkExternalSubjectCommand)
export class LinkExternalSubjectCommandHandler
  extends BaseCommandHandler<LinkExternalSubjectCommand, AccountAggregate>
  implements ICommandHandler<LinkExternalSubjectCommand>
{
  constructor(
    eventBus: EventBus,
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountRepo: IAccountWriteRepository,
  ) {
    super(eventBus);
  }

  async execute(
    command: LinkExternalSubjectCommand,
  ): Promise<AccountAggregate> {
    const account = await this.accountRepo.findByEmail(command.email.value);

    if (!account) {
      throw new AccountNotFoundException(command.email.value);
    }

    account.linkExternalSubject(command.externalSubject.value);
    await this.accountRepo.save(account);
    await this.publishEvents(account);

    return account;
  }
}
