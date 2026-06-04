import { EncryptionService } from '@contexts/auth/application/services/encryption/encryption.service';
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
    private readonly encryptionService: EncryptionService,
    private readonly oauthIdentityBuilder: OAuthIdentityBuilder,
  ) {}

  async execute(command: LinkOAuthIdentityCommand): Promise<void> {
    const {
      userId,
      provider,
      providerUserId,
      email,
      emailVerified,
      accessToken,
      refreshToken,
      tokenExpiresAt,
    } = command;

    // Guard: check if this provider identity is already linked to another account
    const existing = await this.oauthIdentityRepo.findByProviderUserId(
      provider.value,
      providerUserId.value,
    );

    if (existing && existing.userId.value !== userId.value) {
      throw new OAuthIdentityAlreadyLinkedException(
        provider.value,
        providerUserId.value,
      );
    }

    // If already linked to THIS user, no-op
    if (existing && existing.userId.value === userId.value) {
      return;
    }

    // Encrypt provider tokens
    const accessTokenEnc = accessToken
      ? this.encryptionService.encrypt(accessToken.value)
      : null;
    const refreshTokenEnc = refreshToken
      ? this.encryptionService.encrypt(refreshToken.value)
      : null;

    const identity = this.oauthIdentityBuilder
      .withId(UuidValueObject.generate().value)
      .withUserId(userId.value)
      .withProvider(provider.value)
      .withProviderUserId(providerUserId.value)
      .withEmail(email?.value ?? null)
      .withEmailVerified(emailVerified)
      .withAccessTokenEnc(accessTokenEnc)
      .withRefreshTokenEnc(refreshTokenEnc)
      .withTokenExpiresAt(tokenExpiresAt?.value ?? null)
      .build();

    identity.link();
    await this.oauthIdentityRepo.save(identity);
  }
}
