import {
  Criteria,
  PaginatedResult,
  UserStatusEnum,
} from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { UserTypeOrmMapper } from '@contexts/users/infrastructure/persistence/typeorm/mappers/user-typeorm.mapper';
import { UserTypeOrmEntity } from '@contexts/users/infrastructure/persistence/typeorm/entities/user.entity';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { SpaceContext } from '../../../../../../shared/space-context/space-context.service';
import { UserTypeOrmReadRepository } from './user-typeorm-read.repository';

const USER_ID = '550e8400-e29b-41d4-a716-446655440000';
const USERNAME = 'johndoe';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const HOME_SPACE_ID = '880e8400-e29b-41d4-a716-446655440003';

const buildEntity = (): UserTypeOrmEntity => {
  const entity = new UserTypeOrmEntity();
  entity.id = USER_ID;
  entity.spaceId = HOME_SPACE_ID;
  entity.status = UserStatusEnum.ACTIVE;
  entity.username = USERNAME;
  entity.createdAt = new Date('2024-01-01');
  entity.updatedAt = new Date('2024-01-01');
  return entity;
};

describe('UserTypeOrmReadRepository', () => {
  let repository: UserTypeOrmReadRepository;
  let typeOrmRepo: jest.Mocked<Repository<UserTypeOrmEntity>>;
  let mockQb: jest.Mocked<
    Pick<
      SelectQueryBuilder<UserTypeOrmEntity>,
      | 'innerJoin'
      | 'where'
      | 'andWhere'
      | 'orderBy'
      | 'addOrderBy'
      | 'skip'
      | 'take'
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
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getManyAndCount: jest.fn(),
    } as any;

    typeOrmRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    } as unknown as jest.Mocked<Repository<UserTypeOrmEntity>>;

    spaceContext = {
      run: jest.fn(),
      get: jest.fn().mockReturnValue(SPACE_ID),
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as unknown as jest.Mocked<SpaceContext>;

    mapper = new UserTypeOrmMapper(new UserBuilder());

    repository = new UserTypeOrmReadRepository(
      typeOrmRepo,
      mapper,
      spaceContext,
    );
  });

  describe('space membership scoping', () => {
    it('joins space_memberships on the active space instead of filtering by the users table home space_id', async () => {
      mockQb.getOne.mockResolvedValue(buildEntity());

      await repository.findById(USER_ID);

      expect(typeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('user');
      expect(mockQb.innerJoin).toHaveBeenCalledWith(
        'space_memberships',
        'membership',
        'membership.user_id = user.id',
      );
      expect(mockQb.where).toHaveBeenCalledWith(
        'membership.space_id = :spaceId',
        { spaceId: SPACE_ID },
      );
    });

    it('returns a user whose home space_id differs from the active space, as long as a membership row exists', async () => {
      const entity = buildEntity();
      mockQb.getOne.mockResolvedValue(entity);

      const result = await repository.findById(USER_ID);

      expect(result).toBeInstanceOf(UserViewModel);
      expect(result!.id).toBe(USER_ID);
    });
  });

  describe('findByUsername()', () => {
    it('should return a UserViewModel when username matches an entity', async () => {
      mockQb.getOne.mockResolvedValue(buildEntity());

      const result = await repository.findByUsername(USERNAME);

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'user.username = :username',
        { username: USERNAME },
      );
      expect(result).toBeInstanceOf(UserViewModel);
      expect(result!.username).toBe(USERNAME);
    });

    it('should lowercase the username before querying', async () => {
      mockQb.getOne.mockResolvedValue(null);

      await repository.findByUsername('JohnDoe');

      expect(mockQb.andWhere).toHaveBeenCalledWith(
        'user.username = :username',
        { username: 'johndoe' },
      );
    });

    it('should return null when no entity matches the username', async () => {
      mockQb.getOne.mockResolvedValue(null);

      const result = await repository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findById()', () => {
    it('should return a UserViewModel when entity is found by id', async () => {
      mockQb.getOne.mockResolvedValue(buildEntity());

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
    it('joins space_memberships and returns paginated view models for the active space', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[buildEntity()], 1]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(mockQb.innerJoin).toHaveBeenCalledWith(
        'space_memberships',
        'membership',
        'membership.user_id = user.id',
      );
      expect(mockQb.where).toHaveBeenCalledWith(
        'membership.space_id = :spaceId',
        { spaceId: SPACE_ID },
      );
      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(UserViewModel);
      expect(result.total).toBe(1);
    });

    it('returns an empty result when no memberships match the active space', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
