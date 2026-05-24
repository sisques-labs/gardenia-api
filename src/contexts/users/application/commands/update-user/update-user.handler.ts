import { UpdateUserCommand } from '@contexts/users/application/commands/update-user/update-user.command';
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
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UpdateUserCommand): Promise<void> {
    const user = await this.assertUserExistsService.execute(command.id);

    user.update(command);

    await this.userWriteRepository.save(user);
    await this.publishEvents(user);
  }
}
