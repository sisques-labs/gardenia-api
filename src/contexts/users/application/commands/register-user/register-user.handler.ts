import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';

import { UserAggregateBuilder } from '../../../domain/builders/user-aggregate.builder';
import { UserAlreadyExistsException } from '../../../domain/exceptions/user-already-exists.exception';
import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '../../../domain/repositories/i-user-write.repository';
import { RegisterUserCommand } from './register-user.command';

@CommandHandler(RegisterUserCommand)
export class RegisterUserCommandHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    @Inject(USER_WRITE_REPOSITORY)
    private readonly userWriteRepository: IUserWriteRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: RegisterUserCommand): Promise<void> {
    const { email, password } = command;

    const existing = await this.userWriteRepository.findByEmail(email);
    if (existing) {
      throw new UserAlreadyExistsException(email);
    }

    const user = await new UserAggregateBuilder()
      .withEmail(email)
      .withPassword(password)
      .build();

    const userWithContext = this.eventPublisher.mergeObjectContext(user);

    await this.userWriteRepository.save(userWithContext);
    userWithContext.commit();
  }
}
