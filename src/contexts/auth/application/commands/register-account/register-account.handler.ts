import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountAlreadyExistsException } from '@contexts/auth/domain/exceptions/account-already-exists.exception';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  BaseCommandHandler,
  Criteria,
  FilterOperator,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

@CommandHandler(RegisterAccountCommand)
export class RegisterAccountCommandHandler
  extends BaseCommandHandler<RegisterAccountCommand, AccountAggregate>
  implements ICommandHandler<RegisterAccountCommand>
{
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: RegisterAccountCommand): Promise<void> {
    const { email, passwordHash } = command;

    const filters = {
      field: 'email',
      operator: FilterOperator.EQUALS,
      value: email.value,
    };

    const existing = await this.accountWriteRepository.findByCriteria(
      new Criteria([filters]),
    );

    if (existing) {
      throw new AccountAlreadyExistsException(email.value);
    }

    const userId = UuidValueObject.generate().value;

    const account = await new AccountBuilder()
      .withUserId(userId)
      .withEmail(email.value)
      .withPasswordHash(passwordHash.value)
      .build();

    await this.accountWriteRepository.save(account);
    await this.publishEvents(account);
  }
}
