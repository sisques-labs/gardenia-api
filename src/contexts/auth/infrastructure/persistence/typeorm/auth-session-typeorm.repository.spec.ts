import { AuthSessionAggregate } from '@contexts/auth/domain/aggregates/auth-session.aggregate';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { IsNull, Repository, UpdateResult } from 'typeorm';
import { AuthSessionEntity } from './entities/auth-session.entity';
import { AuthSessionTypeOrmMapper } from './mappers/auth-session-typeorm.mapper';
import { AuthSessionTypeOrmWriteRepository } from './repositories/auth-session-typeorm-write.repository';

const VALID_HASH = 'a3b4c5d6'.repeat(8);
const VALID_ID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_USER_ID = '550e8400-e29b-41d4-a716-446655440001';

function buildAggregate(): AuthSessionAggregate {
  const builder = new AuthSessionBuilder();
  return builder
    .withId(VALID_ID)
    .withUserId(VALID_USER_ID)
    .withTokenHash(VALID_HASH)
    .withExpiresAt(new Date(Date.now() + 1000 * 60 * 60 * 24 * 30))
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();
}

function buildEntity(): AuthSessionEntity {
  const entity = new AuthSessionEntity();
  entity.id = VALID_ID;
  entity.userId = VALID_USER_ID;
  entity.tokenHash = VALID_HASH;
  entity.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  entity.revokedAt = null;
  entity.deviceInfo = null;
  entity.createdAt = new Date('2024-01-01');
  entity.updatedAt = new Date('2024-01-01');
  return entity;
}

describe('AuthSessionTypeOrmRepository', () => {
  let repository: AuthSessionTypeOrmWriteRepository;
  let typeOrmRepo: jest.Mocked<Repository<AuthSessionEntity>>;
  let mapper: AuthSessionTypeOrmMapper;

  beforeEach(() => {
    typeOrmRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<AuthSessionEntity>>;

    mapper = new AuthSessionTypeOrmMapper(new AuthSessionBuilder());
    repository = new AuthSessionTypeOrmWriteRepository(typeOrmRepo, mapper);
  });

  describe('save', () => {
    it('should call repo.save with mapped entity', async () => {
      const aggregate = buildAggregate();
      const entity = buildEntity();
      typeOrmRepo.save.mockResolvedValue(entity);

      await repository.save(aggregate);

      expect(typeOrmRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: VALID_ID }),
      );
    });
  });

  describe('findByTokenHash', () => {
    it('should return mapped aggregate when entity found', async () => {
      const entity = buildEntity();
      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByTokenHash(VALID_HASH);

      expect(result).toBeInstanceOf(AuthSessionAggregate);
      expect(result!.tokenHash.value).toBe(VALID_HASH);
    });

    it('should return null when entity not found', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByTokenHash('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return mapped aggregate when entity found', async () => {
      const entity = buildEntity();
      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(VALID_ID);

      expect(result).toBeInstanceOf(AuthSessionAggregate);
      expect(result!.id.value).toBe(VALID_ID);
    });

    it('should return null when entity not found', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('revokeAllByUserId', () => {
    it('should call repo.update with userId and IsNull condition and return affected count', async () => {
      const updateResult: UpdateResult = {
        affected: 3,
        raw: {},
        generatedMaps: [],
      };
      typeOrmRepo.update.mockResolvedValue(updateResult);

      const count = await repository.revokeAllByUserId(VALID_USER_ID);

      expect(typeOrmRepo.update).toHaveBeenCalledWith(
        { userId: VALID_USER_ID, revokedAt: IsNull() },
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
      expect(count).toBe(3);
    });

    it('should return 0 when affected is undefined', async () => {
      const updateResult: UpdateResult = {
        affected: undefined,
        raw: {},
        generatedMaps: [],
      };
      typeOrmRepo.update.mockResolvedValue(updateResult);

      const count = await repository.revokeAllByUserId(VALID_USER_ID);
      expect(count).toBe(0);
    });
  });
});
