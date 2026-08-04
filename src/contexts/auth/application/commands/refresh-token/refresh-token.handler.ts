import { Inject, Logger } from '@nestjs/common';
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

import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { RefreshTokenCommand } from './refresh-token.command';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenCommandHandler
  extends BaseCommandHandler<RefreshTokenCommand, AggregateRoot>
  implements ICommandHandler<RefreshTokenCommand>
{
  private readonly logger = new Logger(RefreshTokenCommandHandler.name);

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
      async (current, findLockedById) => {
        let base = current;

        if (current.revokedAt !== null) {
          // Already rotated. This is either a benign one-hop race (two
          // requests presenting the same, just-rotated token — e.g. two
          // browser tabs refreshing concurrently) or genuine token reuse.
          const graceMs = this.configService.get<number>(
            'auth.refreshReuseGraceMs',
          )!;
          const withinGrace =
            Date.now() - current.revokedAt.getTime() <= graceMs;

          const successor =
            withinGrace && current.replacedBySessionId
              ? await findLockedById(current.replacedBySessionId)
              : null;

          if (successor && successor.revokedAt === null) {
            this.logger.warn(
              `Refresh token reuse grace window applied: userId=${current.userId.value} revokedSessionId=${current.id.value} successorSessionId=${successor.id.value} elapsedMs=${Date.now() - current.revokedAt.getTime()}`,
            );
            base = successor;
          } else {
            // Not recoverable — real reuse (no successor, successor already
            // consumed, or the grace window elapsed).
            current.markReuseDetected();
            await this.sessionRepo.revokeAllByUserId(current.userId.value);
            await this.publishEvents(current);
            throw new RefreshTokenReuseDetectedException();
          }
        }

        if (base.expiresAt < new Date()) {
          throw new InvalidRefreshTokenException();
        }

        const newSession = this.authSessionBuilder
          .withId(UuidValueObject.generate().value)
          .withUserId(base.userId.value)
          .withTokenHash(newHash)
          .withExpiresAt(newExpiry)
          .withDeviceInfo(command.deviceInfo?.value ?? null)
          .build();

        newSession.create();
        resolvedUserId = base.userId.value;

        base.revoke('rotation', newSession.id.value);

        return { revoked: base, created: newSession };
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
      account?.appRole.value ?? AppRoleEnum.USER,
    );

    return { accessToken, refreshToken: newToken };
  }
}
