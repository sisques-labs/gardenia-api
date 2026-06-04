import { ConfigService } from '@nestjs/config';
import { GithubOAuthStrategy } from './github-oauth.strategy';

describe('GithubOAuthStrategy', () => {
  function makeStrategy(): GithubOAuthStrategy {
    const config = {
      get: jest.fn(
        (key: string) =>
          ({
            'auth.githubClientId': 'client-id',
            'auth.githubClientSecret': 'client-secret',
            'auth.githubCallbackUrl': 'https://example.com/callback',
          })[key],
      ),
    } as unknown as ConfigService;
    return new GithubOAuthStrategy(config);
  }

  it('sets emailVerified true for primary+verified email', () => {
    const strategy = makeStrategy();
    const profile = {
      id: 'gh-123',
      displayName: 'Alice',
      emails: [{ value: 'alice@example.com', primary: true, verified: true }],
    } as any;

    const result = strategy.validate('access', undefined, profile);

    expect(result.provider).toBe('github');
    expect(result.providerUserId).toBe('gh-123');
    expect(result.email).toBe('alice@example.com');
    expect(result.emailVerified).toBe(true);
  });

  it('sets emailVerified false when email is not primary+verified', () => {
    const strategy = makeStrategy();
    const profile = {
      id: 'gh-456',
      displayName: 'Bob',
      emails: [
        {
          value: 'bob@users.noreply.github.com',
          primary: true,
          verified: false,
        },
      ],
    } as any;

    const result = strategy.validate('access', undefined, profile);

    expect(result.email).toBe('bob@users.noreply.github.com');
    expect(result.emailVerified).toBe(false);
  });

  it('handles missing emails array gracefully', () => {
    const strategy = makeStrategy();
    const profile = {
      id: 'gh-789',
      displayName: null,
      emails: [],
    } as any;

    const result = strategy.validate('access', undefined, profile);

    expect(result.email).toBeNull();
    expect(result.emailVerified).toBe(false);
  });

  it('returns unverified for non-primary verified email', () => {
    const strategy = makeStrategy();
    const profile = {
      id: 'gh-999',
      displayName: 'Charlie',
      emails: [{ value: 'charlie@work.com', primary: false, verified: true }],
    } as any;

    const result = strategy.validate('access', undefined, profile);

    expect(result.emailVerified).toBe(false);
  });
});
