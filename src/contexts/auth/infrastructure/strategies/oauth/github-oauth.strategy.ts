import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, StrategyOption } from 'passport-github2';

import { OAuthUserProfile } from '@contexts/auth/application/ports/oauth-user-profile';

@Injectable()
export class GithubOAuthStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('auth.githubClientId') ?? '',
      clientSecret: configService.get<string>('auth.githubClientSecret') ?? '',
      callbackURL: configService.get<string>('auth.githubCallbackUrl') ?? '',
      scope: ['user:email'],
    } satisfies StrategyOption);
  }

  validate(
    accessToken: string,
    refreshToken: string | undefined,
    profile: Profile,
  ): OAuthUserProfile {
    // GitHub returns emails array; pick primary + verified email when available.
    // If not marked as primary+verified, treat as unverified to avoid auto-link hijack.
    const primaryVerified = (profile.emails ?? []).find(
      (e: { value: string; primary?: boolean; verified?: boolean }) =>
        e.primary === true && e.verified === true,
    );
    const anyEmail = (profile.emails ?? [])[0];

    const email = primaryVerified?.value ?? anyEmail?.value ?? null;
    const emailVerified = primaryVerified !== undefined;

    return {
      provider: 'github',
      providerUserId: String(profile.id),
      email,
      emailVerified,
      displayName: profile.displayName ?? null,
      rawTokens: {
        accessToken,
        refreshToken: refreshToken ?? null,
        expiresAt: null,
      },
    };
  }
}
