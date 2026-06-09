import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { AssertUserExistsService } from '@contexts/users/application/services/write/assert-user-exists/assert-user-exists.service';
import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';

import { EnsureUserExistsCommand } from './ensure-user-exists.command';

@CommandHandler(EnsureUserExistsCommand)
export class EnsureUserExistsCommandHandler implements ICommandHandler<EnsureUserExistsCommand> {
  constructor(
    private readonly assertUserExistsService: AssertUserExistsService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: EnsureUserExistsCommand): Promise<string> {
    try {
      const user = await this.assertUserExistsService.execute(command.id);
      return user.id.value;
    } catch (error) {
      if (!(error instanceof UserNotFoundException)) {
        throw error;
      }
    }

    return this.commandBus.execute<CreateUserCommand, string>(
      new CreateUserCommand(command.id.value),
    );
  }
}
