import { Inject } from '@nestjs/common';
import {
  AggregateRoot,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { REFRESH_TOKEN_TTL_MS } from '@contexts/auth/application/constants/refresh-token.constants';
import { ValidateAccountCredentialsService } from '@contexts/auth/application/services/read/validate-account-credentials/validate-account-credentials.service';
import { TokenService } from '@contexts/auth/application/services/token.service';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';
import {
  AUTH_SESSION_WRITE_REPOSITORY,
  IAuthSessionWriteRepository,
} from '@contexts/auth/domain/repositories/write/auth-session-write.repository';
import {
  generateRefreshToken,
  hashRefreshToken,
} from '@contexts/auth/infrastructure/security/refresh-token.util';

import { LoginAccountCommand } from './login-account.command';

@CommandHandler(LoginAccountCommand)
export class LoginAccountCommandHandler
  extends BaseCommandHandler<LoginAccountCommand, AggregateRoot>
  implements ICommandHandler<LoginAccountCommand>
{
  constructor(
    eventBus: EventBus,
    private readonly tokenService: TokenService,
    private readonly validateAccountCredentialsService: ValidateAccountCredentialsService,
    @Inject(AUTH_SESSION_WRITE_REPOSITORY)
    private readonly sessionRepo: IAuthSessionWriteRepository,
  ) {
    super(eventBus);
  }

  async execute(
    command: LoginAccountCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const account = await this.validateAccountCredentialsService.execute(
      command.email.value,
      command.password.value,
    );

    if (!account) {
      throw new InvalidCredentialsException();
    }

    const accessToken = this.tokenService.sign(
      account.userId.value,
      account.email.value,
    );

    const plainToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(plainToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const session = AuthSessionBuilder.build({
      id: UuidValueObject.generate().value,
      userId: account.userId.value,
      tokenHash,
      expiresAt,
    });

    session.create();
    await this.sessionRepo.save(session);
    await this.publishEvents(session);

    return { accessToken, refreshToken: plainToken };
  }
}
