import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { ISpaceUserPort } from '@contexts/spaces/application/ports/space-user.port';
import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { UserExistsByIdQuery } from '@contexts/users/application/queries/user-exists-by-id/user-exists-by-id.query';

@Injectable()
export class SpaceUserAdapter implements ISpaceUserPort {
  private readonly logger = new Logger(SpaceUserAdapter.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async ensureUserExists(userId: string): Promise<void> {
    const exists = await this.queryBus.execute<UserExistsByIdQuery, boolean>(
      new UserExistsByIdQuery({ id: userId }),
    );

    if (exists) {
      this.logger.debug(`User ${userId} already exists globally`);
      return;
    }

    this.logger.log(`Creating user ${userId} in current space context`);
    await this.commandBus.execute(new CreateUserCommand(userId));
  }
}
