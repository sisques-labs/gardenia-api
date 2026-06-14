import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { UserTypeOrmMapper } from '@contexts/users/infrastructure/persistence/typeorm/mappers/user-typeorm.mapper';
import { UserTypeOrmEntity } from '@contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { UserStatusEnum } from '@sisques-labs/nestjs-kit';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';
import { UserTypeOrmReadRepository } from './user-typeorm-read.repository';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const USERNAME = 'johndoe';
const SPACE_ID = 'space-id-123';

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

describe('UserTypeOrmReadRepository', () => {
  let repository: UserTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<UserTypeOrmEntity>>;
  let mockQb: jest.Mocked<
    Pick<
      SelectQueryBuilder<UserTypeOrmEntity>,
      | 'innerJoin'
      | 'where'
      | 'skip'
      | 'take'
      | 'addOrderBy'
      | 'getOne'
      | 'getManyAndCount'
    >
  >;
  let mapper: UserTypeOrmMapper;
  let spaceContext: jest.Mocked<SpaceContext>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockQb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getManyAndCount: jest.fn(),
    } as any;

    rawRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    } as unknown as jest.Mocked<Repository<UserTypeOrmEntity>>;

    spaceContext = {
      run: jest.fn(),
      get: jest.fn().mockReturnValue(SPACE_ID),
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as unknown as jest.Mocked<SpaceContext>;

    mapper = new UserTypeOrmMapper(new UserBuilder());

    repository = new UserTypeOrmReadRepository(rawRepo, mapper, spaceContext);
  });

  describe('findById()', () => {
    it('should call innerJoin on space_memberships with correct ON clause and spaceId', async () => {
      const entity = buildEntity();
      mockQb.getOne.mockResolvedValue(entity);

      await repository.findById(USER_ID);

      expect(mockQb.innerJoin).toHaveBeenCalledWith(
        'space_memberships',
        'sm',
        'sm.user_id = u.id AND sm.space_id = :spaceId',
        { spaceId: SPACE_ID },
      );
    });

    it('should filter by id via where clause', async () => {
      const entity = buildEntity();
      mockQb.getOne.mockResolvedValue(entity);

      await repository.findById(USER_ID);

      expect(mockQb.where).toHaveBeenCalledWith('u.id = :id', { id: USER_ID });
    });

    it('should return a UserViewModel when entity is found', async () => {
      const entity = buildEntity();
      mockQb.getOne.mockResolvedValue(entity);

      const result = await repository.findById(USER_ID);

      expect(result).toBeInstanceOf(UserViewModel);
      expect(result!.id).toBe(USER_ID);
    });

    it('should return null when no entity matches the id', async () => {
      mockQb.getOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('should call innerJoin on space_memberships with correct ON clause and spaceId', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(mockQb.innerJoin).toHaveBeenCalledWith(
        'space_memberships',
        'sm',
        'sm.user_id = u.id AND sm.space_id = :spaceId',
        { spaceId: SPACE_ID },
      );
    });

    it('should return a PaginatedResult with the correct shape', async () => {
      const entity = buildEntity();
      mockQb.getManyAndCount.mockResolvedValue([[entity], 1]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(UserViewModel);
      expect(result.total).toBe(1);
    });

    it('should return empty result when no entities match', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findByUsername()', () => {
    it('should call innerJoin on space_memberships with correct ON clause and spaceId', async () => {
      mockQb.getOne.mockResolvedValue(null);

      await repository.findByUsername(USERNAME);

      expect(mockQb.innerJoin).toHaveBeenCalledWith(
        'space_memberships',
        'sm',
        'sm.user_id = u.id AND sm.space_id = :spaceId',
        { spaceId: SPACE_ID },
      );
    });

    it('should filter by username via where clause', async () => {
      mockQb.getOne.mockResolvedValue(null);

      await repository.findByUsername(USERNAME);

      expect(mockQb.where).toHaveBeenCalledWith('u.username = :username', {
        username: USERNAME,
      });
    });

    it('should lowercase the username before querying', async () => {
      mockQb.getOne.mockResolvedValue(null);

      await repository.findByUsername('JohnDoe');

      expect(mockQb.where).toHaveBeenCalledWith('u.username = :username', {
        username: 'johndoe',
      });
    });

    it('should return a UserViewModel when entity is found', async () => {
      const entity = buildEntity();
      mockQb.getOne.mockResolvedValue(entity);

      const result = await repository.findByUsername(USERNAME);

      expect(result).toBeInstanceOf(UserViewModel);
      expect(result!.username).toBe(USERNAME);
    });

    it('should return null when no entity matches the username', async () => {
      mockQb.getOne.mockResolvedValue(null);

      const result = await repository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });
});
