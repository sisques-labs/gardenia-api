import { Inject } from '@nestjs/common';
import {
  AggregateRoot,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';
import { ConfigService } from '@nestjs/config';

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
    private readonly configService: ConfigService,
  ) {
    super(eventBus);
  }

  async execute(
    command: RefreshTokenCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const hash = await this.hashRefreshTokenService.execute(
      command.refreshToken.value,
    );

    const newToken = await this.generateRefreshTokenService.execute();
    const newHash = await this.hashRefreshTokenService.execute(newToken);
    const ttlMs =
      this.configService.get<number>('auth.refreshTokenTtlDays')! * 86_400_000;
    const newExpiry = new Date(Date.now() + ttlMs);

    let resolvedUserId: string | null = null;

    const rotateResult = await this.sessionRepo.rotate(
      hash,
      async (current) => {
        if (current.revokedAt !== null) {
          // REUSE DETECTED — revoke all user sessions
          current.markReuseDetected();
          await this.sessionRepo.revokeAllByUserId(current.userId.value);
          await this.publishEvents(current);
          throw new RefreshTokenReuseDetectedException();
        }

        if (current.expiresAt < new Date()) {
          throw new InvalidRefreshTokenException();
        }

        // Rotate: revoke old session
        current.revoke('rotation');

        const newSession = this.authSessionBuilder
          .withId(UuidValueObject.generate().value)
          .withUserId(current.userId.value)
          .withTokenHash(newHash)
          .withExpiresAt(newExpiry)
          .withDeviceInfo(command.deviceInfo?.value ?? null)
          .build();

        newSession.create();
        resolvedUserId = current.userId.value;

        return newSession;
      },
    );

    if (rotateResult.status === 'not-found') {
      throw new InvalidRefreshTokenException();
    }

    const { oldSession, newSession } = rotateResult;

    await this.publishEvents(oldSession);
    await this.publishEvents(newSession);

    const account = await this.accountRepo.findByUserId(resolvedUserId!);
    const accessToken = this.tokenService.sign(
      resolvedUserId!,
      account?.email.value ?? '',
    );

    return { accessToken, refreshToken: newToken };
  }
}
