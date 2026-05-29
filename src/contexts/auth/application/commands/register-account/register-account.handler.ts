import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { CreateSpaceCommand } from '@contexts/spaces/application/commands/create-space/create-space.command';
import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { Inject } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';
import * as bcrypt from 'bcrypt';
import { SpaceContext } from '../../../../../shared/space-context/space-context.service';

@CommandHandler(RegisterAccountCommand)
export class RegisterAccountCommandHandler
  extends BaseCommandHandler<RegisterAccountCommand, AccountAggregate>
  implements ICommandHandler<RegisterAccountCommand>
{
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
    private readonly commandBus: CommandBus,
    private readonly spaceContext: SpaceContext,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: RegisterAccountCommand): Promise<{ spaceId: string }> {
    const { email, passwordHash } = command;

    // No email uniqueness check here: each registration creates a new Space,
    // and UNIQUE(spaceId, email) at DB level guarantees uniqueness within a Space.
    const userId = await this.commandBus.execute<CreateUserCommand, string>(
      new CreateUserCommand(),
    );

    const spaceId = await this.commandBus.execute<CreateSpaceCommand, string>(
      new CreateSpaceCommand({
        ownerId: userId,
        name: `${email.value}'s Space`,
      }),
    );

    const id = UuidValueObject.generate().value;
    const now = new Date();
    const hashedPassword = await bcrypt.hash(passwordHash.value, 10);
    const account = new AccountBuilder()
      .withId(id)
      .withUserId(userId)
      .withEmail(email.value)
      .withPasswordHash(hashedPassword)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    await this.spaceContext.run(spaceId, async () => {
      await this.accountWriteRepository.save(account);
    });

    account.create();
    await this.publishEvents(account);

    return { spaceId };
  }
}
