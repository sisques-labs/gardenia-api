import { OAuthIdentityBuilder } from './oauth-identity.builder';

describe('OAuthIdentityBuilder', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';
  const validUserId = '660e8400-e29b-41d4-a716-446655440001';

  it('should build a valid OAuthIdentityAggregate with all fields', () => {
    const aggregate = new OAuthIdentityBuilder()
      .withId(validId)
      .withUserId(validUserId)
      .withProvider('google')
      .withProviderUserId('google-user-123')
      .withEmail('user@example.com')
      .withEmailVerified(true)
      .withAccessTokenEnc('enc-access-token')
      .withRefreshTokenEnc('enc-refresh-token')
      .withTokenExpiresAt(new Date('2025-01-01'))
      .build();

    expect(aggregate.id.value).toBe(validId);
    expect(aggregate.userId.value).toBe(validUserId);
    expect(aggregate.provider.value).toBe('google');
    expect(aggregate.providerUserId.value).toBe('google-user-123');
    expect(aggregate.email?.value).toBe('user@example.com');
    expect(aggregate.emailVerified.value).toBe(true);
    expect(aggregate.accessTokenEnc?.value).toBe('enc-access-token');
    expect(aggregate.refreshTokenEnc?.value).toBe('enc-refresh-token');
  });

  it('should build with null email and no tokens', () => {
    const aggregate = new OAuthIdentityBuilder()
      .withId(validId)
      .withUserId(validUserId)
      .withProvider('github')
      .withProviderUserId('gh-456')
      .build();

    expect(aggregate.email).toBeNull();
    expect(aggregate.accessTokenEnc).toBeNull();
    expect(aggregate.refreshTokenEnc).toBeNull();
  });

  it('should throw when required fields are missing', () => {
    expect(() => new OAuthIdentityBuilder().build()).toThrow();
    expect(() => new OAuthIdentityBuilder().withId(validId).build()).toThrow();
  });

  it('should round-trip through fromPrimitives', () => {
    const now = new Date();
    const primitives = {
      id: validId,
      userId: validUserId,
      provider: 'apple',
      providerUserId: 'apple-789',
      email: null,
      emailVerified: false,
      accessTokenEnc: null,
      refreshTokenEnc: null,
      tokenExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const aggregate = new OAuthIdentityBuilder()
      .fromPrimitives(primitives)
      .build();
    expect(aggregate.id.value).toBe(validId);
    expect(aggregate.provider.value).toBe('apple');
  });
});
