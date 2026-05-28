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
import { Criteria } from '@sisques-labs/nestjs-kit';

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
    const criteria = {
      pagination: { page: 1, perPage: 1000 },
      sorts: [],
      filters: [],
    } as unknown as Criteria;
    const result = await this.sessionRepo.findByCriteria(criteria);
    const sessions = result.items.filter(
      (session) =>
        session.userId.value === command.userId.value &&
        session.revokedAt === null,
    );

    for (const session of sessions) {
      session.revoke('logout-all');
      await this.sessionRepo.save(session);
      await this.publishEvents(session);
    }
  }
}
