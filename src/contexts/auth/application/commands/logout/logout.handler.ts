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
import { HashRefreshTokenService } from '@contexts/auth/application/services/write/hash-refresh-token/hash-refresh-token.service';

import { LogoutCommand } from './logout.command';

@CommandHandler(LogoutCommand)
export class LogoutCommandHandler
  extends BaseCommandHandler<LogoutCommand, AggregateRoot>
  implements ICommandHandler<LogoutCommand>
{
  constructor(
    eventBus: EventBus,
    private readonly hashRefreshTokenService: HashRefreshTokenService,
    @Inject(AUTH_SESSION_WRITE_REPOSITORY)
    private readonly sessionRepo: IAuthSessionWriteRepository,
  ) {
    super(eventBus);
  }

  async execute(command: LogoutCommand): Promise<void> {
    const hash = await this.hashRefreshTokenService.execute(
      command.refreshToken,
    );
    const session = await this.sessionRepo.findByTokenHash(hash);

    if (!session) {
      return;
    }

    if (session.revokedAt !== null) {
      return;
    }

    session.revoke('user-logout');
    await this.sessionRepo.save(session);
    await this.publishEvents(session);
  }
}
