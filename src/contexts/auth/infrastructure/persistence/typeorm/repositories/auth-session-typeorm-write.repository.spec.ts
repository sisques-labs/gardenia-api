import { EntityManager, IsNull, Repository, UpdateResult } from 'typeorm';

import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { AuthSessionEntity } from '../entities/auth-session.entity';
import { AuthSessionTypeOrmMapper } from '../mappers/auth-session-typeorm.mapper';
import { AuthSessionTypeOrmWriteRepository } from './auth-session-typeorm-write.repository';

const SESSION_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const TOKEN_HASH = 'a'.repeat(64);

const buildEntity = (
  overrides: Partial<AuthSessionEntity> = {},
): AuthSessionEntity => {
  const e = new AuthSessionEntity();
  e.id = SESSION_ID;
  e.userId = USER_ID;
  e.tokenHash = TOKEN_HASH;
  e.expiresAt = new Date('2026-08-01');
  e.revokedAt = null;
  e.deviceInfo = 'iPhone';
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return Object.assign(e, overrides);
};

const buildAggregate = () =>
  new AuthSessionBuilder()
    .withId(SESSION_ID)
    .withUserId(USER_ID)
    .withTokenHash(TOKEN_HASH)
    .withExpiresAt(new Date('2026-08-01'))
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('AuthSessionTypeOrmWriteRepository', () => {
  let repository: AuthSessionTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<AuthSessionEntity>>;
  let mapper: AuthSessionTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    } as unknown as jest.Mocked<Repository<AuthSessionEntity>>;

    mapper = new AuthSessionTypeOrmMapper(new AuthSessionBuilder());

    repository = new AuthSessionTypeOrmWriteRepository(rawRepo, mapper);
  });

  describe('save()', () => {
    it('persists the aggregate and returns domain object', async () => {
      rawRepo.save.mockResolvedValue(buildEntity());
      const aggregate = buildAggregate();

      const result = await repository.save(aggregate);

      expect(rawRepo.save).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(AuthSessionAggregate);
      expect(result.id.value).toBe(SESSION_ID);
    });
  });

  describe('findByTokenHash()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findByTokenHash(TOKEN_HASH);

      expect(rawRepo.findOne).toHaveBeenCalledWith({
        where: { tokenHash: TOKEN_HASH },
      });
      expect(result).toBeInstanceOf(AuthSessionAggregate);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByTokenHash('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findById()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(SESSION_ID);

      expect(result).toBeInstanceOf(AuthSessionAggregate);
      expect(result!.id.value).toBe(SESSION_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('returns an empty paginated result regardless of the criteria', async () => {
      const result = await repository.findByCriteria(undefined as any);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(SESSION_ID);

      expect(rawRepo.delete).toHaveBeenCalledWith(SESSION_ID);
    });
  });

  describe('revokeAllByUserId()', () => {
    it('updates active sessions and returns the affected count', async () => {
      const updateResult: UpdateResult = {
        affected: 2,
        raw: {},
        generatedMaps: [],
      };
      rawRepo.update.mockResolvedValue(updateResult);

      const count = await repository.revokeAllByUserId(USER_ID);

      expect(rawRepo.update).toHaveBeenCalledWith(
        { userId: USER_ID, revokedAt: IsNull() },
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
      expect(count).toBe(2);
    });

    it('returns 0 when affected is undefined', async () => {
      const updateResult: UpdateResult = {
        affected: undefined,
        raw: {},
        generatedMaps: [],
      };
      rawRepo.update.mockResolvedValue(updateResult);

      const count = await repository.revokeAllByUserId(USER_ID);

      expect(count).toBe(0);
    });
  });

  describe('rotate()', () => {
    it('returns { status: not-found } when no entity matches the tokenHash', async () => {
      const em = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      } as unknown as jest.Mocked<EntityManager>;

      (rawRepo.manager.transaction as jest.Mock).mockImplementation(
        (fn: (em: EntityManager) => Promise<unknown>) => fn(em),
      );

      const result = await repository.rotate('nonexistent-hash', jest.fn());

      expect(result).toEqual({ status: 'not-found' });
      expect(em.save).not.toHaveBeenCalled();
    });

    it('uses pessimistic_write lock mode when finding the entity', async () => {
      const entity = buildEntity();
      const newSession = buildAggregate();

      const em = {
        findOne: jest.fn().mockResolvedValue(entity),
        save: jest.fn().mockResolvedValue(entity),
      } as unknown as jest.Mocked<EntityManager>;

      (rawRepo.manager.transaction as jest.Mock).mockImplementation(
        (fn: (em: EntityManager) => Promise<unknown>) => fn(em),
      );

      await repository.rotate(TOKEN_HASH, async () => newSession);

      expect(em.findOne).toHaveBeenCalledWith(
        AuthSessionEntity,
        expect.objectContaining({
          where: { tokenHash: TOKEN_HASH },
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });

    it('saves both the old and new session within the same transaction', async () => {
      const entity = buildEntity();
      const newAggregate = buildAggregate();

      const em = {
        findOne: jest.fn().mockResolvedValue(entity),
        save: jest.fn().mockResolvedValue(entity),
      } as unknown as jest.Mocked<EntityManager>;

      (rawRepo.manager.transaction as jest.Mock).mockImplementation(
        (fn: (em: EntityManager) => Promise<unknown>) => fn(em),
      );

      const result = await repository.rotate(TOKEN_HASH, async (_current) => {
        return newAggregate;
      });

      expect(em.save).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({ status: 'ok' });
    });
  });
});
