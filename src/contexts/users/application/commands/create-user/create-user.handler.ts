import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { UserAggregate } from '@contexts/users/domain/aggregates/user.aggregate';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '@contexts/users/domain/repositories/write/user-write.repository';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  extends BaseCommandHandler<CreateUserCommand, UserAggregate>
  implements ICommandHandler<CreateUserCommand, string>
{
  private readonly logger = new Logger(CreateUserCommandHandler.name);

  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
    private readonly userBuilder: UserBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(_command: CreateUserCommand): Promise<string> {
    const id = UuidValueObject.generate().value;
    const username = `user_${id.replace(/-/g, '').slice(0, 8)}`;

    const user = this.userBuilder
      .withId(id)
      .withStatus(UserStatusEnum.ACTIVE)
      .withUsername(username)
      .build();

    await this.userWriteRepository.save(user);
    await this.publishEvents(user);

    return id;
  }
}
