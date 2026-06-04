import { ConfigService } from '@nestjs/config';
import { GoogleOAuthStrategy } from './google-oauth.strategy';

describe('GoogleOAuthStrategy', () => {
  function makeStrategy(
    overrides: Record<string, string> = {},
  ): GoogleOAuthStrategy {
    const defaults: Record<string, string> = {
      'auth.googleClientId': 'client-id',
      'auth.googleClientSecret': 'client-secret',
      'auth.googleCallbackUrl': 'https://example.com/callback',
      ...overrides,
    };
    const config = {
      get: jest.fn((key: string) => defaults[key]),
    } as unknown as ConfigService;
    return new GoogleOAuthStrategy(config);
  }

  it('maps a full google profile to OAuthUserProfile', () => {
    const strategy = makeStrategy();
    const profile = {
      id: 'google-sub-123',
      displayName: 'John Doe',
      emails: [{ value: 'john@example.com', verified: true }],
    } as any;

    const result = strategy.validate('access-token', 'refresh-token', profile);

    expect(result.provider).toBe('google');
    expect(result.providerUserId).toBe('google-sub-123');
    expect(result.email).toBe('john@example.com');
    expect(result.emailVerified).toBe(true);
    expect(result.displayName).toBe('John Doe');
    expect(result.rawTokens.accessToken).toBe('access-token');
    expect(result.rawTokens.refreshToken).toBe('refresh-token');
    expect(result.rawTokens.expiresAt).toBeNull();
  });

  it('sets emailVerified false when not present', () => {
    const strategy = makeStrategy();
    const profile = {
      id: 'google-sub-456',
      displayName: 'Jane',
      emails: [{ value: 'jane@example.com' }],
    } as any;

    const result = strategy.validate('access-token', undefined, profile);

    expect(result.emailVerified).toBe(false);
    expect(result.rawTokens.refreshToken).toBeNull();
  });

  it('handles missing email', () => {
    const strategy = makeStrategy();
    const profile = {
      id: 'google-sub-789',
      displayName: null,
      emails: [],
    } as any;

    const result = strategy.validate('access-token', undefined, profile);

    expect(result.email).toBeNull();
    expect(result.displayName).toBeNull();
  });
});
