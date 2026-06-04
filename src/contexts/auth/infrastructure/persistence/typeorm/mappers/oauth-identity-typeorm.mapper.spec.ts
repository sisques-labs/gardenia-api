import { OAuthIdentityTypeOrmMapper } from './oauth-identity-typeorm.mapper';
import { OAuthIdentityTypeOrmEntity } from '../entities/oauth-identity.entity';

const makeEntity = (
  overrides?: Partial<OAuthIdentityTypeOrmEntity>,
): OAuthIdentityTypeOrmEntity => {
  const entity = new OAuthIdentityTypeOrmEntity();
  entity.id = '550e8400-e29b-41d4-a716-446655440000';
  entity.userId = '660e8400-e29b-41d4-a716-446655440001';
  entity.provider = 'google';
  entity.providerUserId = 'google-123';
  entity.email = 'user@example.com';
  entity.emailVerified = true;
  entity.accessTokenEnc = 'enc:access-token';
  entity.refreshTokenEnc = 'enc:refresh-token';
  entity.tokenExpiresAt = null;
  entity.createdAt = new Date('2024-01-01');
  entity.updatedAt = new Date('2024-01-01');
  return Object.assign(entity, overrides);
};

describe('OAuthIdentityTypeOrmMapper', () => {
  let mapper: OAuthIdentityTypeOrmMapper;

  beforeEach(() => {
    mapper = new OAuthIdentityTypeOrmMapper();
  });

  it('should map entity to domain aggregate (toAggregate)', () => {
    const entity = makeEntity();
    const domain = mapper.toAggregate(entity);

    expect(domain.id.value).toBe(entity.id);
    expect(domain.userId.value).toBe(entity.userId);
    expect(domain.provider.value).toBe('google');
    expect(domain.providerUserId.value).toBe('google-123');
    expect(domain.email?.value).toBe('user@example.com');
    expect(domain.emailVerified).toBe(true);
    expect(domain.accessTokenEnc).toBe('enc:access-token');
  });

  it('should map domain aggregate back to entity (toEntity)', () => {
    const entity = makeEntity();
    const domain = mapper.toAggregate(entity);
    const backToEntity = mapper.toEntity(domain);

    expect(backToEntity.id).toBe(entity.id);
    expect(backToEntity.userId).toBe(entity.userId);
    expect(backToEntity.provider).toBe(entity.provider);
    expect(backToEntity.providerUserId).toBe(entity.providerUserId);
    expect(backToEntity.email).toBe(entity.email);
    expect(backToEntity.accessTokenEnc).toBe(entity.accessTokenEnc);
  });

  it('should handle null email and null tokens', () => {
    const entity = makeEntity({
      email: null,
      accessTokenEnc: null,
      refreshTokenEnc: null,
    });
    const domain = mapper.toAggregate(entity);

    expect(domain.email).toBeNull();
    expect(domain.accessTokenEnc).toBeNull();
    expect(domain.refreshTokenEnc).toBeNull();
  });
});
