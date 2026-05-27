import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountAlreadyExistsException } from '@contexts/auth/domain/exceptions/account-already-exists.exception';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

@CommandHandler(RegisterAccountCommand)
export class RegisterAccountCommandHandler
  extends BaseCommandHandler<RegisterAccountCommand, AccountAggregate>
  implements ICommandHandler<RegisterAccountCommand>
{
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
    private readonly commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: RegisterAccountCommand): Promise<void> {
    const { email, passwordHash } = command;

    const existing = await this.accountWriteRepository.findByEmail(email.value);
    if (existing) {
      throw new AccountAlreadyExistsException(email.value);
    }

    const userId = await this.commandBus.execute<CreateUserCommand, string>(
      new CreateUserCommand(),
    );

    const id = UuidValueObject.generate().value;
    const now = new Date();
    const account = new AccountBuilder()
      .withId(id)
      .withUserId(userId)
      .withEmail(email.value)
      .withPasswordHash(passwordHash.value)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    await this.accountWriteRepository.save(account);
    await this.publishEvents(account);
  }
}
