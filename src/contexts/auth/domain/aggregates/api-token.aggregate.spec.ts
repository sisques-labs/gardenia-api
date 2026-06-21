import { ApiTokenHashValueObject } from '@contexts/auth/domain/value-objects/api-token-hash/api-token-hash.vo';
import { ApiTokenIdValueObject } from '@contexts/auth/domain/value-objects/api-token-id/api-token-id.vo';
import { ApiTokenLabelValueObject } from '@contexts/auth/domain/value-objects/api-token-label/api-token-label.vo';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { ApiTokenAggregate } from './api-token.aggregate';

const HASH = 'a'.repeat(64);

function buildAggregate(
  overrides: Partial<{ revokedAt: Date | null; lastUsedAt: Date | null }> = {},
): ApiTokenAggregate {
  return new ApiTokenAggregate({
    id: new ApiTokenIdValueObject(UuidValueObject.generate().value),
    userId: new UuidValueObject(UuidValueObject.generate().value),
    spaceId: new UuidValueObject(UuidValueObject.generate().value),
    label: new ApiTokenLabelValueObject('Home Assistant'),
    tokenHash: new ApiTokenHashValueObject(HASH),
    lastUsedAt: overrides.lastUsedAt ?? null,
    revokedAt: overrides.revokedAt ?? null,
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('ApiTokenAggregate', () => {
  it('is not revoked by default', () => {
    expect(buildAggregate().isRevoked()).toBe(false);
  });

  it('revoke() marks the token revoked', () => {
    const token = buildAggregate();
    token.revoke();
    expect(token.isRevoked()).toBe(true);
    expect(token.revokedAt).toBeInstanceOf(Date);
  });

  it('revoke() is idempotent (keeps the first revocation time)', () => {
    const token = buildAggregate();
    token.revoke();
    const first = token.revokedAt;
    token.revoke();
    expect(token.revokedAt).toBe(first);
  });

  it('markUsed() records the last-used timestamp', () => {
    const token = buildAggregate();
    const at = new Date('2026-01-01T00:00:00Z');
    token.markUsed(at);
    expect(token.lastUsedAt).toBe(at);
  });

  it('toPrimitives() exposes the hash but no plaintext', () => {
    const primitives = buildAggregate().toPrimitives();
    expect(primitives.tokenHash).toBe(HASH);
    expect(primitives).not.toHaveProperty('token');
  });

  it('rejects an invalid hash', () => {
    expect(() => new ApiTokenHashValueObject('not-a-hash')).toThrow();
  });

  it('rejects an empty label', () => {
    expect(() => new ApiTokenLabelValueObject('')).toThrow();
  });
});
