import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { AuthSessionBuilder } from './auth-session.builder';

const VALID_HASH = 'a3b4c5d6'.repeat(8);
const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_USER_UUID = '550e8400-e29b-41d4-a716-446655440001';

describe('AuthSessionBuilder', () => {
  it('should build a valid AuthSessionAggregate without emitting events', () => {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    const session = AuthSessionBuilder.build({
      id: VALID_UUID,
      userId: VALID_USER_UUID,
      tokenHash: VALID_HASH,
      expiresAt,
    });

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
    const session = AuthSessionBuilder.build({
      id: VALID_UUID,
      userId: VALID_USER_UUID,
      tokenHash: VALID_HASH,
      expiresAt: new Date(),
      deviceInfo: 'Mozilla/5.0',
    });

    expect(session.deviceInfo).toBe('Mozilla/5.0');
  });
});
