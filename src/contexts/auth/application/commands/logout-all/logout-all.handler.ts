import { Inject } from '@nestjs/common';
import {
  AggregateRoot,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import {
  AUTH_SESSION_WRITE_REPOSITORY,
  IAuthSessionWriteRepository,
} from '@contexts/auth/domain/repositories/write/auth-session-write.repository';

import { LogoutAllCommand } from './logout-all.command';

@CommandHandler(LogoutAllCommand)
export class LogoutAllCommandHandler
  extends BaseCommandHandler<LogoutAllCommand, AggregateRoot>
  implements ICommandHandler<LogoutAllCommand>
{
  constructor(
    eventBus: EventBus,
    @Inject(AUTH_SESSION_WRITE_REPOSITORY)
    private readonly sessionRepo: IAuthSessionWriteRepository,
  ) {
    super(eventBus);
  }

  async execute(command: LogoutAllCommand): Promise<void> {
    const sessions = await this.sessionRepo.findActiveByUserId(command.userId);

    for (const session of sessions) {
      session.revoke('logout-all');
      await this.sessionRepo.save(session);
      await this.publishEvents(session);
    }
  }
}
