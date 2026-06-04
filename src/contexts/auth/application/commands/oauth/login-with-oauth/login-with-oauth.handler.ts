import { TokenEncryptionService } from '@contexts/auth/application/services/oauth/token-encryption.service';
import { OAuthIdentityBuilder } from '@contexts/auth/domain/builders/oauth-identity.builder';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { OAuthEmailNotVerifiedException } from '@contexts/auth/domain/exceptions/oauth-email-not-verified.exception';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import {
  AUTH_SESSION_WRITE_REPOSITORY,
  IAuthSessionWriteRepository,
} from '@contexts/auth/domain/repositories/write/auth-session-write.repository';
import {
  IOAuthIdentityWriteRepository,
  OAUTH_IDENTITY_WRITE_REPOSITORY,
} from '@contexts/auth/domain/repositories/write/oauth-identity-write.repository';
import { CreateSpaceCommand } from '@contexts/spaces/application/commands/create-space/create-space.command';
import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { Inject } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { TokenService } from '@contexts/auth/application/services/token.service';
import { GenerateRefreshTokenService } from '@contexts/auth/application/services/write/generate-refresh-token/generate-refresh-token.service';
import { HashRefreshTokenService } from '@contexts/auth/application/services/write/hash-refresh-token/hash-refresh-token.service';
import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { LoginWithOAuthCommand } from './login-with-oauth.command';

@CommandHandler(LoginWithOAuthCommand)
export class LoginWithOAuthCommandHandler
  extends BaseCommandHandler<LoginWithOAuthCommand, AuthSessionAggregate>
  implements ICommandHandler<LoginWithOAuthCommand>
{
  constructor(
    eventBus: EventBus,
    @Inject(OAUTH_IDENTITY_WRITE_REPOSITORY)
    private readonly oauthIdentityRepo: IOAuthIdentityWriteRepository,
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountRepo: IAccountWriteRepository,
    @Inject(AUTH_SESSION_WRITE_REPOSITORY)
    private readonly sessionRepo: IAuthSessionWriteRepository,
    private readonly tokenEncryptionService: TokenEncryptionService,
    private readonly tokenService: TokenService,
    private readonly generateRefreshTokenService: GenerateRefreshTokenService,
    private readonly hashRefreshTokenService: HashRefreshTokenService,
    private readonly authSessionBuilder: AuthSessionBuilder,
    private readonly commandBus: CommandBus,
    private readonly spaceContext: SpaceContext,
    private readonly configService: ConfigService,
  ) {
    super(eventBus);
  }

  async execute(
    command: LoginWithOAuthCommand,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { profile, deviceInfo } = command;

    let userId: string;
    let email: string;

    // Step 1: check for an existing oauth identity
    const existingIdentity = await this.oauthIdentityRepo.findByProviderUserId(
      profile.provider,
      profile.providerUserId,
    );

    if (existingIdentity) {
      // Returning OAuth user — resolve userId from existing identity
      userId = existingIdentity.userId.value;
      email = existingIdentity.email?.value ?? profile.email ?? '';
    } else {
      // No existing identity — attempt email-based auto-link or provision new user
      if (!profile.email) {
        // Cannot link or create without an email
        throw new OAuthEmailNotVerifiedException(profile.provider);
      }

      const existingAccount = await this.accountRepo.findByEmail(profile.email);

      if (existingAccount) {
        // Email matches an existing local account
        if (!profile.emailVerified) {
          throw new OAuthEmailNotVerifiedException(profile.provider);
        }
        // Auto-link: create oauth identity for the existing account
        userId = existingAccount.userId.value;
        email = profile.email;
      } else {
        // Brand new user — provision user + space
        if (!profile.emailVerified) {
          throw new OAuthEmailNotVerifiedException(profile.provider);
        }

        userId = UuidValueObject.generate().value;
        email = profile.email;

        const spaceId = await this.commandBus.execute<
          CreateSpaceCommand,
          string
        >(
          new CreateSpaceCommand({
            ownerId: userId,
            name: `${email}'s Space`,
          }),
        );

        await this.spaceContext.run(spaceId, async () => {
          await this.commandBus.execute(new CreateUserCommand(userId));
        });
      }

      // Create the OAuth identity record
      const accessTokenEnc = profile.rawTokens.accessToken
        ? this.tokenEncryptionService.encrypt(profile.rawTokens.accessToken)
        : null;
      const refreshTokenEnc = profile.rawTokens.refreshToken
        ? this.tokenEncryptionService.encrypt(profile.rawTokens.refreshToken)
        : null;

      const identity = new OAuthIdentityBuilder()
        .withId(UuidValueObject.generate().value)
        .withUserId(userId)
        .withProvider(profile.provider)
        .withProviderUserId(profile.providerUserId)
        .withEmail(profile.email)
        .withEmailVerified(profile.emailVerified)
        .withAccessTokenEnc(accessTokenEnc)
        .withRefreshTokenEnc(refreshTokenEnc)
        .withTokenExpiresAt(profile.rawTokens.expiresAt)
        .build();

      await this.oauthIdentityRepo.save(identity);
    }

    // Step 2: issue session (same flow as LoginAccountCommandHandler)
    const accessToken = this.tokenService.sign(userId, email);

    const plainToken = await this.generateRefreshTokenService.execute();
    const tokenHash = await this.hashRefreshTokenService.execute(plainToken);
    const ttlMs =
      this.configService.get<number>('auth.refreshTokenTtlDays')! * 86_400_000;
    const expiresAt = new Date(Date.now() + ttlMs);

    const session = this.authSessionBuilder
      .withId(UuidValueObject.generate().value)
      .withUserId(userId)
      .withTokenHash(tokenHash)
      .withExpiresAt(expiresAt)
      .withDeviceInfo(deviceInfo ?? null)
      .build();

    session.create();
    await this.sessionRepo.save(session);
    await this.publishEvents(session);

    return { accessToken, refreshToken: plainToken };
  }
}
