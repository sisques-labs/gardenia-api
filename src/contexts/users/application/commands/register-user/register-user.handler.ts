import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { UserAggregate } from '../../../domain/aggregates/user.aggregate';
import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '../../../domain/repositories/write/user-write.repository';
import { RegisterUserCommand } from './register-user.command';

@CommandHandler(RegisterUserCommand)
export class RegisterUserCommandHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<void> {
    const { userId, role, status } = command;

    const user = UserAggregate.create(userId, role, status);
    const userWithContext = this.eventPublisher.mergeObjectContext(user);

    await this.userWriteRepository.save(userWithContext);
    userWithContext.commit();
  }
}
