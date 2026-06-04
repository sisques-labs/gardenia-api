import { OAuthIdentityBuilder } from './oauth-identity.builder';

describe('OAuthIdentityBuilder', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';
  const validUserId = '660e8400-e29b-41d4-a716-446655440001';

  it('should build a valid OAuthIdentityEntity with all fields', () => {
    const entity = new OAuthIdentityBuilder()
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

    expect(entity.id.value).toBe(validId);
    expect(entity.userId.value).toBe(validUserId);
    expect(entity.provider.value).toBe('google');
    expect(entity.providerUserId.value).toBe('google-user-123');
    expect(entity.email?.value).toBe('user@example.com');
    expect(entity.emailVerified).toBe(true);
    expect(entity.accessTokenEnc).toBe('enc-access-token');
    expect(entity.refreshTokenEnc).toBe('enc-refresh-token');
  });

  it('should build with null email and no tokens', () => {
    const entity = new OAuthIdentityBuilder()
      .withId(validId)
      .withUserId(validUserId)
      .withProvider('github')
      .withProviderUserId('gh-456')
      .build();

    expect(entity.email).toBeNull();
    expect(entity.accessTokenEnc).toBeNull();
    expect(entity.refreshTokenEnc).toBeNull();
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

    const entity = new OAuthIdentityBuilder()
      .fromPrimitives(primitives)
      .build();
    expect(entity.id.value).toBe(validId);
    expect(entity.provider.value).toBe('apple');
  });
});
