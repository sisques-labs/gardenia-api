import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { AuthSessionBuilder } from './auth-session.builder';

const VALID_HASH = 'a3b4c5d6'.repeat(8);
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_USER_UUID = '550e8400-e29b-41d4-a716-446655440001';

describe('AuthSessionBuilder', () => {
  it('should build a valid AuthSessionAggregate without emitting events', () => {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    const builder = new AuthSessionBuilder();

    const session = builder
      .withId(VALID_UUID)
      .withUserId(VALID_USER_UUID)
      .withTokenHash(VALID_HASH)
      .withExpiresAt(expiresAt)
      .build();

    expect(session).toBeInstanceOf(AuthSessionAggregate);
    expect(session.id.value).toBe(VALID_UUID);
    expect(session.userId.value).toBe(VALID_USER_UUID);
    expect(session.tokenHash.value).toBe(VALID_HASH);
    expect(session.expiresAt).toEqual(expiresAt);
    expect(session.revokedAt).toBeNull();
    expect(session.deviceInfo).toBeNull();

    // build() must NOT emit events
    expect(session.getUncommittedEvents()).toHaveLength(0);
  });

  it('should build with optional deviceInfo', () => {
    const builder = new AuthSessionBuilder();
    const session = builder
      .withId(VALID_UUID)
      .withUserId(VALID_USER_UUID)
      .withTokenHash(VALID_HASH)
      .withExpiresAt(new Date())
      .withDeviceInfo('Mozilla/5.0')
      .build();

    expect(session.deviceInfo).toBe('Mozilla/5.0');
  });

  it('should not leak revokedAt from a prior fromPrimitives chain into a new build', () => {
    const builder = new AuthSessionBuilder();
    const revokedAt = new Date('2026-06-08T16:26:46.695Z');

    builder
      .fromPrimitives({
        id: VALID_UUID,
        userId: VALID_USER_UUID,
        tokenHash: VALID_HASH,
        expiresAt: new Date('2026-07-08T00:00:00.000Z'),
        revokedAt,
        deviceInfo: null,
        createdAt: new Date('2026-06-07T19:04:20.105Z'),
        updatedAt: new Date('2026-06-08T14:26:46.697Z'),
      })
      .build();

    const freshSession = builder
      .withId('660e8400-e29b-41d4-a716-446655440002')
      .withUserId('770e8400-e29b-41d4-a716-446655440003')
      .withTokenHash('b4c5d6e7'.repeat(8))
      .withExpiresAt(new Date(Date.now() + 86_400_000))
      .build();

    expect(freshSession.revokedAt).toBeNull();
    expect(freshSession.createdAt.value.getTime()).toBeGreaterThan(
      revokedAt.getTime(),
    );
  });
});
