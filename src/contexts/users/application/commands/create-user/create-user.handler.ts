import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserCreationFailedEvent } from '@contexts/users/domain/events/user-creation-failed/user-creation-failed.event';
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
    private readonly eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateUserCommand): Promise<void> {
    try {
      const user = this.userBuilder
        .withId(command.id)
        .withStatus(command.status.value)
        .build();

      await this.userWriteRepository.save(user);
      await this.publishEvents(user);
    } catch (error) {
      await this.eventBus.publish(
        new UserCreationFailedEvent(
          {
            aggregateRootId: command.id,
            aggregateRootType: UserAggregate.name,
            entityId: command.id,
            entityType: UserAggregate.name,
            eventType: UserCreationFailedEvent.name,
          },
          {
            userId: command.id,
            reason: error instanceof Error ? error.message : String(error),
          },
        ),
      );
    }
  }
}
