import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

import { OAuthUserProfile } from '@contexts/auth/application/ports/oauth-user-profile';

// @nicokaiser/passport-apple has no TypeScript types — require it directly.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AppleStrategy = require('@nicokaiser/passport-apple');

export interface AppleProfile {
  id: string;
  displayName?: string;
  name?: { firstName?: string; lastName?: string };
  email?: string;
  // Apple returns email_verified as a string "true" | "false"
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
      clientID: configService.get<string>('auth.appleClientId') ?? '',
      teamID: configService.get<string>('auth.appleTeamId') ?? '',
      keyID: configService.get<string>('auth.appleKeyId') ?? '',
      // The private key is stored as a string with literal \n — convert to actual newlines.
      key: (configService.get<string>('auth.applePrivateKey') ?? '').replace(
        /\\n/g,
        '\n',
      ),
      callbackURL: configService.get<string>('auth.appleCallbackUrl') ?? '',
      scope: ['name', 'email'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string | undefined,
    idTokenPayload: Record<string, unknown>,
    profile: AppleProfile,
  ): OAuthUserProfile {
    // Apple only returns name/email on first authorization; idTokenPayload carries sub + email.
    const sub = (idTokenPayload['sub'] as string | undefined) ?? profile.id;
    const email =
      (idTokenPayload['email'] as string | null | undefined) ??
      profile.email ??
      null;

    // Apple returns email_verified as the string "true" or boolean true
    const rawVerified = idTokenPayload['email_verified'];
    const emailVerified = rawVerified === true || rawVerified === 'true';

    const firstName = profile.name?.firstName;
    const lastName = profile.name?.lastName;
    const displayName =
      firstName || lastName
        ? [firstName, lastName].filter(Boolean).join(' ')
        : (profile.displayName ?? null);

    return {
      provider: 'apple',
      providerUserId: sub,
      email,
      emailVerified,
      displayName,
      rawTokens: {
        accessToken,
        refreshToken: refreshToken ?? null,
        expiresAt: null,
      },
    };
  }
}
