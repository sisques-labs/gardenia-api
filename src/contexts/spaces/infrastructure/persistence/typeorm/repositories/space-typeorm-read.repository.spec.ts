import { SelectQueryBuilder, Repository } from 'typeorm';

import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';
import { SpaceEntity } from '../entities/space.entity';
import { SpaceTypeOrmMapper } from '../mappers/space-typeorm.mapper';
import { SpaceTypeOrmReadRepository } from './space-typeorm-read.repository';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440001';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440002';
const MEMBER_SPACE_ID = '550e8400-e29b-41d4-a716-446655440003';
const CREATED_AT = new Date('2024-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2024-01-01T00:00:00.000Z');

const buildSpaceEntity = (): SpaceEntity => {
  const entity = new SpaceEntity();
  entity.id = SPACE_ID;
  entity.name = 'Test Space';
  entity.ownerId = OWNER_ID;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return entity;
};

function buildQueryBuilderMock(
  results: SpaceEntity[],
): jest.Mocked<SelectQueryBuilder<SpaceEntity>> {
  const qb = {
    innerJoin: jest.fn(),
    where: jest.fn(),
    getMany: jest.fn().mockResolvedValue(results),
  } as unknown as jest.Mocked<SelectQueryBuilder<SpaceEntity>>;
  (qb.innerJoin as jest.Mock).mockReturnValue(qb);
  (qb.where as jest.Mock).mockReturnValue(qb);
  return qb;
}

describe('SpaceTypeOrmReadRepository', () => {
  let repository: SpaceTypeOrmReadRepository;
  let spaceRepo: jest.Mocked<Repository<SpaceEntity>>;
  let spaceMapper: SpaceTypeOrmMapper;

  beforeEach(() => {
    jest.clearAllMocks();

    spaceRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      createQueryBuilder: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<SpaceEntity>>;

    spaceMapper = new SpaceTypeOrmMapper(new SpaceBuilder());

    repository = new SpaceTypeOrmReadRepository(spaceRepo, spaceMapper);
  });

  describe('findById()', () => {
    it('should return a SpaceViewModel when entity is found', async () => {
      const entity = buildSpaceEntity();
      spaceRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(SPACE_ID);

      expect(spaceRepo.findOne).toHaveBeenCalledWith({
        where: { id: SPACE_ID },
      });
      expect(result).toBeInstanceOf(SpaceViewModel);
      expect(result?.id).toBe(SPACE_ID);
    });

    it('should return null when entity is not found', async () => {
      spaceRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('should return a paginated list of SpaceViewModels', async () => {
      const entity = buildSpaceEntity();
      spaceRepo.findAndCount.mockResolvedValue([[entity], 1]);

      const { Criteria } = await import('@sisques-labs/nestjs-kit');
      const criteria = new Criteria([], [], { page: 1, perPage: 10 });
      const result = await repository.findByCriteria(criteria);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0]).toBeInstanceOf(SpaceViewModel);
    });
  });

  describe('findByMember()', () => {
    it('should return owner-space and member-space when user has both', async () => {
      const ownerEntity = buildSpaceEntity();

      const memberEntity = new SpaceEntity();
      memberEntity.id = MEMBER_SPACE_ID;
      memberEntity.name = 'Member Space';
      memberEntity.ownerId = '550e8400-e29b-41d4-a716-446655440099';
      memberEntity.createdAt = CREATED_AT;
      memberEntity.updatedAt = UPDATED_AT;

      const qb = buildQueryBuilderMock([ownerEntity, memberEntity]);
      (spaceRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await repository.findByMember(OWNER_ID);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.items[0]).toBeInstanceOf(SpaceViewModel);
      expect(result.items[1]).toBeInstanceOf(SpaceViewModel);
      expect(result.items[0].id).toBe(SPACE_ID);
      expect(result.items[1].id).toBe(MEMBER_SPACE_ID);

      expect(qb.innerJoin).toHaveBeenCalledWith(
        'space_memberships',
        expect.any(String),
        expect.stringContaining('space_id'),
      );
      expect(qb.where).toHaveBeenCalledWith(
        expect.stringContaining('user_id'),
        expect.objectContaining({ userId: OWNER_ID }),
      );
    });

    it('should return empty result when user has no memberships', async () => {
      const qb = buildQueryBuilderMock([]);
      (spaceRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

      const result = await repository.findByMember(OWNER_ID);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });
});
