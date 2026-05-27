import { UserStatusEnum } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { UserTypeOrmMapper } from '@contexts/users/infrastructure/persistence/typeorm/mappers/user-typeorm.mapper';
import { UserTypeOrmEntity } from '@contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { UserTypeOrmReadRepository } from './user-typeorm-read.repository';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const USERNAME = 'johndoe';

const buildEntity = (): UserTypeOrmEntity => {
  const entity = new UserTypeOrmEntity();
  entity.id = USER_ID;
  entity.status = UserStatusEnum.ACTIVE;
  entity.username = USERNAME;
  entity.createdAt = new Date('2024-01-01');
  entity.updatedAt = new Date('2024-01-01');
  return entity;
};

describe('UserTypeOrmReadRepository', () => {
  let repository: UserTypeOrmReadRepository;
  let typeOrmRepo: jest.Mocked<Repository<UserTypeOrmEntity>>;
  let mapper: UserTypeOrmMapper;

  beforeEach(() => {
    jest.clearAllMocks();

    typeOrmRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<UserTypeOrmEntity>>;

    mapper = new UserTypeOrmMapper(new UserBuilder());

    repository = new UserTypeOrmReadRepository(typeOrmRepo, mapper);
  });

  describe('findByUsername()', () => {
    it('should return a UserViewModel when username matches an entity', async () => {
      const entity = buildEntity();
      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByUsername(USERNAME);

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { username: USERNAME },
      });
      expect(result).toBeInstanceOf(UserViewModel);
      expect(result!.username).toBe(USERNAME);
    });

    it('should lowercase the username before querying', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      await repository.findByUsername('JohnDoe');

      expect(typeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { username: 'johndoe' },
      });
    });

    it('should return null when no entity matches the username', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findById()', () => {
    it('should return a UserViewModel when entity is found by id', async () => {
      const entity = buildEntity();
      typeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(USER_ID);

      expect(result).toBeInstanceOf(UserViewModel);
      expect(result!.id).toBe(USER_ID);
    });

    it('should return null when no entity matches the id', async () => {
      typeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });
});
