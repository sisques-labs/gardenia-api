import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { ISpaceUserPort } from '@contexts/spaces/application/ports/space-user.port';
import { EnsureUserExistsCommand } from '@contexts/users/application/commands/ensure-user-exists/ensure-user-exists.command';

@Injectable()
export class SpaceUserAdapter implements ISpaceUserPort {
  private readonly logger = new Logger(SpaceUserAdapter.name);

  constructor(private readonly commandBus: CommandBus) {}

  async ensureUserExists(userId: string): Promise<void> {
    this.logger.log(`Ensuring user ${userId} exists in current space context`);
    await this.commandBus.execute(new EnsureUserExistsCommand(userId));
  }
}
