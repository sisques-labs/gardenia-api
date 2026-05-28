import { Inject } from '@nestjs/common';
import {
  AggregateRoot,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { REFRESH_TOKEN_TTL_MS } from '@contexts/auth/application/constants/refresh-token.constants';
import { TokenService } from '@contexts/auth/application/services/token.service';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { InvalidRefreshTokenException } from '@contexts/auth/domain/exceptions/invalid-refresh-token.exception';
import { RefreshTokenReuseDetectedException } from '@contexts/auth/domain/exceptions/refresh-token-reuse-detected.exception';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import {
  AUTH_SESSION_WRITE_REPOSITORY,
  IAuthSessionWriteRepository,
} from '@contexts/auth/domain/repositories/write/auth-session-write.repository';
import {
  generateRefreshToken,
  hashRefreshToken,
} from '@contexts/auth/infrastructure/security/refresh-token.util';

import { RefreshTokenCommand } from './refresh-token.command';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler
  extends BaseCommandHandler<RefreshTokenCommand, AggregateRoot>
  implements ICommandHandler<RefreshTokenCommand>
{
  constructor(
    eventBus: EventBus,
    @Inject(AUTH_SESSION_WRITE_REPOSITORY)
    private readonly sessionRepo: IAuthSessionWriteRepository,
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountRepo: IAccountWriteRepository,
    private readonly tokenService: TokenService,
  ) {
    super(eventBus);
  }

  async execute(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const hash = hashRefreshToken(command.refreshToken);

    // TODO(ADR-5): wrap in DataSource pessimistic_write lock for production concurrency safety
    const session = await this.sessionRepo.findByTokenHash(hash);

    if (!session) {
      throw new InvalidRefreshTokenException();
    }

    if (session.revokedAt !== null) {
      // REUSE DETECTED — revoke all user sessions
      session.markReuseDetected();
      await this.sessionRepo.revokeAllByUserId(session.userId.value);
      await this.publishEvents(session);
      throw new RefreshTokenReuseDetectedException();
    }

    if (session.expiresAt < new Date()) {
      throw new InvalidRefreshTokenException();
    }

    // Rotate: revoke old session
    session.revoke('rotation');
    await this.sessionRepo.save(session);

    // Create new session
    const newToken = generateRefreshToken();
    const newHash = hashRefreshToken(newToken);
    const newExpiry = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const newSession = AuthSessionBuilder.build({
      id: UuidValueObject.generate().value,
      userId: session.userId.value,
      tokenHash: newHash,
      expiresAt: newExpiry,
      deviceInfo: command.deviceInfo,
    });

    newSession.create();
    await this.sessionRepo.save(newSession);

    await this.publishEvents(session);
    await this.publishEvents(newSession);

    const account = await this.accountRepo.findByUserId(session.userId.value);
    const accessToken = this.tokenService.sign(
      session.userId.value,
      account?.email.value ?? '',
    );

    return { accessToken, refreshToken: newToken };
  }
}
