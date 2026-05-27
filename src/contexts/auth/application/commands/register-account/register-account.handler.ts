import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import { AssertAccountEmailAvailableService } from '@contexts/auth/application/services/write/assert-account-email-available/assert-account-email-available.service';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { Inject } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

@CommandHandler(RegisterAccountCommand)
export class RegisterAccountCommandHandler
  extends BaseCommandHandler<RegisterAccountCommand, AccountAggregate>
  implements ICommandHandler<RegisterAccountCommand>
{
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
    private readonly assertAccountEmailAvailableService: AssertAccountEmailAvailableService,
    private readonly commandBus: CommandBus,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: RegisterAccountCommand): Promise<void> {
    const { email, passwordHash } = command;

    await this.assertAccountEmailAvailableService.execute(email);

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
    account.create();
    await this.publishEvents(account);
  }
}
