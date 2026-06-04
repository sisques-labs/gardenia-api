import { LoginWithOAuthCommandInput } from '@contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.command';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

// @nicokaiser/passport-apple has no TypeScript types — require it directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AppleStrategy = require('@nicokaiser/passport-apple');

export interface AppleProfile {
  id: string;
  displayName?: string;
  name?: { firstName?: string; lastName?: string };
  email?: string;
  email_verified?: string;
  emails?: Array<{ value: string }>;
}

@Injectable()
export class AppleOAuthStrategy extends PassportStrategy(
  AppleStrategy,
  'apple',
) {
  constructor(configService: ConfigService) {
    super({
      clientID:
        configService.get<string>('auth.appleClientId') ?? 'unconfigured',
      teamID: configService.get<string>('auth.appleTeamId') ?? 'unconfigured',
      keyID: configService.get<string>('auth.appleKeyId') ?? 'unconfigured',
      key: (
        configService.get<string>('auth.applePrivateKey') ?? 'unconfigured'
      ).replace(/\\n/g, '\n'),
      callbackURL:
        configService.get<string>('auth.appleCallbackUrl') ?? 'unconfigured',
      scope: ['name', 'email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string | undefined,
    idTokenPayload: Record<string, unknown>,
    profile: AppleProfile,
  ): Omit<LoginWithOAuthCommandInput, 'deviceInfo'> {
    const sub = (idTokenPayload['sub'] as string | undefined) ?? profile.id;
    const email =
      (idTokenPayload['email'] as string | null | undefined) ??
      profile.email ??
      null;
    const rawVerified = idTokenPayload['email_verified'];
    const emailVerified = rawVerified === true || rawVerified === 'true';

    return {
      provider: 'apple',
      providerUserId: sub,
      email,
      emailVerified,
      accessToken,
      refreshToken: refreshToken ?? null,
      tokenExpiresAt: null,
    };
  }
}
