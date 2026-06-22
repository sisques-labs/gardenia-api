import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { AuthSessionEntity } from '../entities/auth-session.entity';
import { AuthSessionTypeOrmMapper } from './auth-session-typeorm.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');
const EXPIRES_AT = new Date('2026-02-01T00:00:00.000Z');

const buildEntity = (
  overrides: Partial<AuthSessionEntity> = {},
): AuthSessionEntity => {
  const entity = new AuthSessionEntity();
  entity.id = ID;
  entity.userId = USER_ID;
  entity.tokenHash = 'a'.repeat(64);
  entity.expiresAt = EXPIRES_AT;
  entity.revokedAt = null;
  entity.deviceInfo = 'iPhone';
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return Object.assign(entity, overrides);
};

describe('AuthSessionTypeOrmMapper', () => {
  let mapper: AuthSessionTypeOrmMapper;

  beforeEach(() => {
    mapper = new AuthSessionTypeOrmMapper(new AuthSessionBuilder());
  });

  describe('toAggregate()', () => {
    it('hydrates the aggregate from entity primitives', () => {
      const result = mapper.toAggregate(buildEntity());

      expect(result).toBeInstanceOf(AuthSessionAggregate);
      expect(result.id.value).toBe(ID);
      expect(result.userId.value).toBe(USER_ID);
      expect(result.tokenHash.value).toBe('a'.repeat(64));
      expect(result.expiresAt).toEqual(EXPIRES_AT);
      expect(result.revokedAt).toBeNull();
      expect(result.deviceInfo).toBe('iPhone');
    });

    it('maps a revoked session', () => {
      const revokedAt = new Date('2026-01-15');
      const result = mapper.toAggregate(buildEntity({ revokedAt }));

      expect(result.revokedAt).toEqual(revokedAt);
    });
  });

  describe('toEntity()', () => {
    it('serializes the aggregate into entity primitives', () => {
      const aggregate = mapper.toAggregate(buildEntity());

      const result = mapper.toEntity(aggregate);

      expect(result).toBeInstanceOf(AuthSessionEntity);
      expect(result.id).toBe(ID);
      expect(result.tokenHash).toBe('a'.repeat(64));
      expect(result.deviceInfo).toBe('iPhone');
      expect(result.revokedAt).toBeNull();
    });
  });

  describe('toViewModel()', () => {
    it('maps entity primitives into a view model', () => {
      const vm = mapper.toViewModel(buildEntity());

      expect(vm.tokenHash).toBe('a'.repeat(64));
      expect(vm.deviceInfo).toBe('iPhone');
      expect(vm.revokedAt).toBeNull();
    });
  });

  describe('toPrimitives()', () => {
    it('delegates to the aggregate serialization', () => {
      const aggregate = mapper.toAggregate(buildEntity());

      const primitives = mapper.toPrimitives(aggregate);

      expect(primitives.id).toBe(ID);
      expect(primitives.userId).toBe(USER_ID);
      expect(primitives.tokenHash).toBe('a'.repeat(64));
    });
  });
});
