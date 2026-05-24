import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { UserRoleEnum, UserStatusEnum, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { RegisterUserCommand } from '@contexts/users/application/commands/register-user/register-user.command';

import { AccountAggregateBuilder } from '../../../domain/builders/account-aggregate.builder';
import { AccountAlreadyExistsException } from '../../../domain/exceptions/account-already-exists.exception';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '../../../domain/repositories/i-account-write.repository';
import { RegisterAccountCommand } from './register-account.command';

@CommandHandler(RegisterAccountCommand)
export class RegisterAccountCommandHandler
  implements ICommandHandler<RegisterAccountCommand>
{
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
    private readonly commandBus: CommandBus,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: RegisterAccountCommand): Promise<void> {
    const { email, password } = command;

    const existing = await this.accountWriteRepository.findByEmail(email);
    if (existing) {
      throw new AccountAlreadyExistsException(email);
    }

    const userId = UuidValueObject.generate().value;

    const account = await new AccountAggregateBuilder()
      .withUserId(userId)
      .withEmail(email)
      .withPassword(password)
      .build();

    const accountWithContext = this.eventPublisher.mergeObjectContext(account);

    await this.accountWriteRepository.save(accountWithContext);
    accountWithContext.commit();

    await this.commandBus.execute(
      new RegisterUserCommand(userId, UserRoleEnum.USER, UserStatusEnum.ACTIVE),
    );
  }
}
