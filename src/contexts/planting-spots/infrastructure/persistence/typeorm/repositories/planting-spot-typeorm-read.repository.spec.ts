import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { PlantingSpotBuilder } from '@contexts/planting-spots/domain/builders/planting-spot.builder';
import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { PlantingSpotTypeOrmEntity } from '../entities/planting-spot.entity';
import { PlantingSpotTypeOrmMapper } from '../mappers/planting-spot-typeorm.mapper';
import { PlantingSpotTypeOrmReadRepository } from './planting-spot-typeorm-read.repository';

const SPOT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';

const buildSpotEntity = (
  overrides: Partial<PlantingSpotTypeOrmEntity> = {},
): PlantingSpotTypeOrmEntity => {
  const e = new PlantingSpotTypeOrmEntity();
  e.id = SPOT_ID;
  e.name = 'Bancal Norte';
  e.type = PlantingSpotTypeEnum.RAISED_BED;
  e.description = null;
  e.status = PlantingSpotStatusEnum.ACTIVE;
  e.fallowSince = null;
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2024-01-01');
  e.updatedAt = new Date('2024-01-01');
  return { ...e, ...overrides };
};

function createMockQueryBuilder(
  result: [PlantingSpotTypeOrmEntity[], number],
): jest.Mocked<SelectQueryBuilder<PlantingSpotTypeOrmEntity>> {
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue(result),
  };
  return qb as unknown as jest.Mocked<
    SelectQueryBuilder<PlantingSpotTypeOrmEntity>
  >;
}

describe('PlantingSpotTypeOrmReadRepository', () => {
  let repository: PlantingSpotTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<PlantingSpotTypeOrmEntity>>;
  let mapper: PlantingSpotTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlantingSpotTypeOrmEntity>>;

    mapper = new PlantingSpotTypeOrmMapper(new PlantingSpotBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new PlantingSpotTypeOrmReadRepository(
      rawRepo,
      mapper,
      spaceContext,
    );
  });

  describe('findById()', () => {
    it('should return a PlantingSpotViewModel when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildSpotEntity());

      const result = await repository.findById(SPOT_ID);

      expect(result).toBeInstanceOf(PlantingSpotViewModel);
      expect(result?.id).toBe(SPOT_ID);
    });

    it('should return null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    const emptyCriteria = new Criteria(undefined, undefined, undefined);

    it('should return a PaginatedResult with view models', async () => {
      rawRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([[buildSpotEntity()], 1]),
      );

      const result = await repository.findByCriteria(emptyCriteria);

      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(PlantingSpotViewModel);
      expect(result.total).toBe(1);
    });

    it('should return empty paginated result when no entities match', async () => {
      rawRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([[], 0]),
      );

      const result = await repository.findByCriteria(emptyCriteria);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should return correct type value from entity', async () => {
      const potEntity = buildSpotEntity({ type: PlantingSpotTypeEnum.POT });
      rawRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder([[potEntity], 1]),
      );

      const result = await repository.findByCriteria(emptyCriteria);

      expect(result.items[0].type).toBe(PlantingSpotTypeEnum.POT);
    });
  });
});
