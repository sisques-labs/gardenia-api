import { DeleteUserCommand } from '@contexts/users/application/commands/delete-user/delete-user.command';
import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '@contexts/users/domain/repositories/write/user-write.repository';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler
  extends BaseCommandHandler<DeleteUserCommand, UserAggregate>
  implements ICommandHandler<DeleteUserCommand>
{
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteUserCommand): Promise<void> {
    const user = await this.userWriteRepository.findById(command.id.value);

    if (!user) return;

    user.delete();

    await this.userWriteRepository.delete(user.id.value);
    await this.publishEvents(user);
  }
}
