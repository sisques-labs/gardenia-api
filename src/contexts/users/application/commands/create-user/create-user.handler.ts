import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { AssertUsernameAvailableService } from '@contexts/users/application/services/read/assert-username-available/assert-username-available.service';
import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '@contexts/users/domain/repositories/write/user-write.repository';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  extends BaseCommandHandler<CreateUserCommand, UserAggregate>
  implements ICommandHandler<CreateUserCommand>
{
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
    private readonly userBuilder: UserBuilder,
    private readonly assertUsernameAvailableService: AssertUsernameAvailableService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateUserCommand): Promise<void> {
    await this.assertUsernameAvailableService.execute(command.username);

    const user = this.userBuilder
      .withStatus(command.status.value)
      .withUsername(command.username.value)
      .build();

    await this.userWriteRepository.save(user);
    await this.publishEvents(user);
  }
}
