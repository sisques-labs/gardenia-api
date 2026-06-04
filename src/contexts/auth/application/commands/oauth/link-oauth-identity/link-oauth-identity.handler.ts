import { TokenEncryptionService } from '@contexts/auth/application/services/oauth/token-encryption.service';
import { OAuthIdentityBuilder } from '@contexts/auth/domain/builders/oauth-identity.builder';
import { OAuthIdentityAlreadyLinkedException } from '@contexts/auth/domain/exceptions/oauth-identity-already-linked.exception';
import {
  IOAuthIdentityWriteRepository,
  OAUTH_IDENTITY_WRITE_REPOSITORY,
} from '@contexts/auth/domain/repositories/write/oauth-identity-write.repository';
import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { LinkOAuthIdentityCommand } from './link-oauth-identity.command';

@CommandHandler(LinkOAuthIdentityCommand)
export class LinkOAuthIdentityCommandHandler implements ICommandHandler<LinkOAuthIdentityCommand> {
  constructor(
    @Inject(OAUTH_IDENTITY_WRITE_REPOSITORY)
    private readonly oauthIdentityRepo: IOAuthIdentityWriteRepository,
    private readonly tokenEncryptionService: TokenEncryptionService,
  ) {}

  async execute(command: LinkOAuthIdentityCommand): Promise<void> {
    const { userId, profile } = command;

    // Guard: check if this provider identity is already linked to another account
    const existing = await this.oauthIdentityRepo.findByProviderUserId(
      profile.provider,
      profile.providerUserId,
    );

    if (existing && existing.userId.value !== userId) {
      throw new OAuthIdentityAlreadyLinkedException(
        profile.provider,
        profile.providerUserId,
      );
    }

    // If already linked to THIS user, no-op
    if (existing && existing.userId.value === userId) {
      return;
    }

    // Encrypt provider tokens
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
}
