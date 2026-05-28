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
import { GenerateRefreshTokenService } from '@contexts/auth/application/services/write/generate-refresh-token/generate-refresh-token.service';
import { HashRefreshTokenService } from '@contexts/auth/application/services/write/hash-refresh-token/hash-refresh-token.service';
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
    private readonly authSessionBuilder: AuthSessionBuilder,
    private readonly generateRefreshTokenService: GenerateRefreshTokenService,
    private readonly hashRefreshTokenService: HashRefreshTokenService,
  ) {
    super(eventBus);
  }

  async execute(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const hash = await this.hashRefreshTokenService.execute(
      command.refreshToken,
    );

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
    const newToken = await this.generateRefreshTokenService.execute();
    const newHash = await this.hashRefreshTokenService.execute(newToken);
    const newExpiry = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const newSession = this.authSessionBuilder
      .withId(UuidValueObject.generate().value)
      .withUserId(session.userId.value)
      .withTokenHash(newHash)
      .withExpiresAt(newExpiry)
      .withDeviceInfo(command.deviceInfo ?? null)
      .build();

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
