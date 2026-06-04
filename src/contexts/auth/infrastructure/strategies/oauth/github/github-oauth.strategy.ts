import { LoginWithOAuthCommandInput } from '@contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.command';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, StrategyOption } from 'passport-github2';

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
  ): Omit<LoginWithOAuthCommandInput, 'deviceInfo'> {
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
      accessToken,
      refreshToken: refreshToken ?? null,
      tokenExpiresAt: null,
    };
  }
}
