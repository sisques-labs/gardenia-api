import { ConfigService } from '@nestjs/config';

// Stub @nicokaiser/passport-apple before importing the strategy
jest.mock('@nicokaiser/passport-apple', () => {
  return class MockAppleStrategy {
    name = 'apple';
    constructor(_options: unknown, verify: (...args: unknown[]) => void) {
      this._verify = verify;
    }
    _verify: (...args: unknown[]) => void;
  };
});

import { AppleOAuthStrategy } from './apple-oauth.strategy';

describe('AppleOAuthStrategy', () => {
  function makeStrategy(
    overrides: Record<string, string> = {},
  ): AppleOAuthStrategy {
    const defaults: Record<string, string> = {
      'auth.appleClientId': 'com.example.app',
      'auth.appleTeamId': 'TEAM123',
      'auth.appleKeyId': 'KEY456',
      'auth.applePrivateKey':
        '-----BEGIN EC PRIVATE KEY-----\\nABC\\n-----END EC PRIVATE KEY-----',
      'auth.appleCallbackUrl': 'https://example.com/auth/oauth/apple/callback',
      ...overrides,
    };
    const config = {
      get: jest.fn((key: string) => defaults[key]),
    } as unknown as ConfigService;
    return new AppleOAuthStrategy(config);
  }

  it('maps idTokenPayload fields to OAuthUserProfile', () => {
    const strategy = makeStrategy();
    const idTokenPayload = {
      sub: 'apple-sub-001',
      email: 'user@privaterelay.appleid.com',
      email_verified: 'true',
    };
    const profile = {} as any;

    const result = strategy.validate(
      'access',
      undefined,
      idTokenPayload,
      profile,
    );

    expect(result.provider).toBe('apple');
    expect(result.providerUserId).toBe('apple-sub-001');
    expect(result.email).toBe('user@privaterelay.appleid.com');
    expect(result.emailVerified).toBe(true);
  });

  it('sets emailVerified false when email_verified is "false"', () => {
    const strategy = makeStrategy();
    const idTokenPayload = {
      sub: 'apple-sub-002',
      email: 'another@example.com',
      email_verified: 'false',
    };

    const result = strategy.validate(
      'access',
      undefined,
      idTokenPayload,
      {} as any,
    );

    expect(result.emailVerified).toBe(false);
  });

  it('concatenates first and last name from profile', () => {
    const strategy = makeStrategy();
    const idTokenPayload = { sub: 'apple-sub-003' };
    const profile = { name: { firstName: 'John', lastName: 'Doe' } } as any;

    const result = strategy.validate(
      'access',
      undefined,
      idTokenPayload,
      profile,
    );

    expect(result.displayName).toBe('John Doe');
  });

  it('falls back to profile.id when sub is missing from idTokenPayload', () => {
    const strategy = makeStrategy();
    const idTokenPayload = {};
    const profile = { id: 'profile-id-fallback' } as any;

    const result = strategy.validate(
      'access',
      undefined,
      idTokenPayload,
      profile,
    );

    expect(result.providerUserId).toBe('profile-id-fallback');
  });
});
