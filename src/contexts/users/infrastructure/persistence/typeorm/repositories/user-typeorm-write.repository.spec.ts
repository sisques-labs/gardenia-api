import { UserStatusEnum } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { UserTypeOrmMapper } from '@contexts/users/infrastructure/persistence/typeorm/mappers/user-typeorm.mapper';
import { UserTypeOrmEntity } from '@contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';
import { UserTypeOrmWriteRepository } from './user-typeorm-write.repository';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const USERNAME = 'johndoe';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (): UserTypeOrmEntity => {
  const entity = new UserTypeOrmEntity();
  entity.id = USER_ID;
  entity.spaceId = SPACE_ID;
  entity.status = UserStatusEnum.ACTIVE;
  entity.username = USERNAME;
  entity.firstName = null;
  entity.lastName = null;
  entity.avatarUrl = null;
  entity.bio = null;
  entity.locale = null;
  entity.timezone = null;
  entity.createdAt = new Date('2024-01-01');
  entity.updatedAt = new Date('2024-01-01');
  return entity;
};

const buildUser = () =>
  new UserBuilder()
    .withId(USER_ID)
    .withStatus(UserStatusEnum.ACTIVE)
    .withUsername(USERNAME)
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('UserTypeOrmWriteRepository', () => {
  let repository: UserTypeOrmWriteRepository;
  let typeOrmRepo: jest.Mocked<Repository<UserTypeOrmEntity>>;
  let mapper: jest.Mocked<UserTypeOrmMapper>;
  let spaceContext: jest.Mocked<SpaceContext>;

  beforeEach(() => {
    jest.clearAllMocks();

    typeOrmRepo = {
      save: jest.fn(),
      delete: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserTypeOrmEntity>>;

    mapper = {
      toEntity: jest.fn(),
      toAggregate: jest.fn(),
      toViewModel: jest.fn(),
    } as unknown as jest.Mocked<UserTypeOrmMapper>;

    spaceContext = {
      run: jest.fn(),
      get: jest.fn().mockReturnValue(SPACE_ID),
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as unknown as jest.Mocked<SpaceContext>;

    repository = new UserTypeOrmWriteRepository(
      mapper,
      typeOrmRepo,
      spaceContext,
    );
  });

  describe('tenant proxy', () => {
    it('should inject spaceId into save call', async () => {
      const user = buildUser();
      const entity = buildEntity();

      mapper.toEntity.mockReturnValue(entity);
      typeOrmRepo.save.mockResolvedValue(entity);
      mapper.toAggregate.mockReturnValue(user);

      await repository.save(user);

      expect(typeOrmRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ spaceId: SPACE_ID }),
      );
    });

    it('should NOT inject spaceId into findById — UUID lookups bypass tenant isolation', async () => {
      const entity = buildEntity();
      const user = buildUser();

      typeOrmRepo.findOne.mockResolvedValue(entity);
      mapper.toAggregate.mockReturnValue(user);

      await repository.findById(USER_ID);

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: USER_ID } }),
      );
    });
  });

  describe('save()', () => {
    it('should call TypeORM save once with the mapped entity', async () => {
      const user = buildUser();
      const entity = buildEntity();

      mapper.toEntity.mockReturnValue(entity);
      typeOrmRepo.save.mockResolvedValue(entity);
      mapper.toAggregate.mockReturnValue(user);

      await repository.save(user);

      expect(mapper.toEntity).toHaveBeenCalledWith(user);
      expect(typeOrmRepo.save).toHaveBeenCalledTimes(1);
      expect(typeOrmRepo.save).toHaveBeenCalledWith(entity);
    });

    it('should return the aggregate mapped from the saved entity', async () => {
      const user = buildUser();
      const entity = buildEntity();

      mapper.toEntity.mockReturnValue(entity);
      typeOrmRepo.save.mockResolvedValue(entity);
      mapper.toAggregate.mockReturnValue(user);

      const result = await repository.save(user);

      expect(mapper.toAggregate).toHaveBeenCalledWith(entity);
      expect(result).toBe(user);
    });
  });

  describe('delete()', () => {
    it('should call TypeORM delete once by id only — UUID deletes bypass tenant isolation', async () => {
      typeOrmRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(USER_ID);

      expect(typeOrmRepo.delete).toHaveBeenCalledTimes(1);
      expect(typeOrmRepo.delete).toHaveBeenCalledWith(USER_ID);
    });

    it('should resolve without throwing when delete succeeds', async () => {
      typeOrmRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await expect(repository.delete(USER_ID)).resolves.not.toThrow();
    });
  });

  describe('findById()', () => {
    it('should return a UserAggregate when entity is found', async () => {
      const entity = buildEntity();
      const user = buildUser();

      typeOrmRepo.findOne.mockResolvedValue(entity);
      mapper.toAggregate.mockReturnValue(user);

      const result = await repository.findById(USER_ID);

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: USER_ID },
      });
      expect(result).toBe(user);
    });

    it('should return null when entity is not found', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });
});
