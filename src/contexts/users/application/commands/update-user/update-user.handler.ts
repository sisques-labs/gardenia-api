import { UpdateUserCommand } from '@contexts/users/application/commands/update-user/update-user.command';
import { AssertUsernameAvailableService } from '@contexts/users/application/services/read/assert-username-available/assert-username-available.service';
import { AssertUserExistsService } from '@contexts/users/application/services/write/assert-user-exists/assert-user-exists.service';
import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '@contexts/users/domain/repositories/write/user-write.repository';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler
  extends BaseCommandHandler<UpdateUserCommand, UserAggregate>
  implements ICommandHandler<UpdateUserCommand>
{
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
    private readonly assertUserExistsService: AssertUserExistsService,
    private readonly assertUsernameAvailableService: AssertUsernameAvailableService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UpdateUserCommand): Promise<void> {
    const user = await this.assertUserExistsService.execute(command.id);

    if (command.username) {
      await this.assertUsernameAvailableService.execute(command.username);
    }

    user.update(command);

    await this.userWriteRepository.save(user);
    await this.publishEvents(user);
  }
}
