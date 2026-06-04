import { LoginWithOAuthCommandInput } from '@contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.command';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, StrategyOptions } from 'passport-google-oauth20';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('auth.googleClientId') ?? '',
      clientSecret: configService.get<string>('auth.googleClientSecret') ?? '',
      callbackURL: configService.get<string>('auth.googleCallbackUrl') ?? '',
      scope: ['email', 'profile'],
    } satisfies StrategyOptions);
  }

  validate(
    accessToken: string,
    refreshToken: string | undefined,
    profile: Profile,
  ): Omit<LoginWithOAuthCommandInput, 'deviceInfo'> {
    const email = profile.emails?.[0]?.value ?? null;
    const rawVerified = profile.emails?.[0]?.verified;
    const emailVerified = rawVerified === true;

    return {
      provider: 'google',
      providerUserId: profile.id,
      email,
      emailVerified,
      accessToken,
      refreshToken: refreshToken ?? null,
      tokenExpiresAt: null,
    };
  }
}
