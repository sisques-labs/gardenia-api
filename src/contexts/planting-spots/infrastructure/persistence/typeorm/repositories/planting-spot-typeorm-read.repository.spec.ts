import { Repository } from 'typeorm';

import { PlantingSpotBuilder } from '@contexts/planting-spots/domain/builders/planting-spot.builder';
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
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2024-01-01');
  e.updatedAt = new Date('2024-01-01');
  return { ...e, ...overrides };
};

describe('PlantingSpotTypeOrmReadRepository', () => {
  let repository: PlantingSpotTypeOrmReadRepository;
  let rawRepo: jest.Mocked<Repository<PlantingSpotTypeOrmEntity>>;
  let mapper: PlantingSpotTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
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

      const result = await repository.findById(SPOT_ID, SPACE_ID);

      expect(result).toBeInstanceOf(PlantingSpotViewModel);
      expect(result?.id).toBe(SPOT_ID);
    });

    it('should return null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent', SPACE_ID);

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('should return an array of PlantingSpotViewModels for the given spaceId', async () => {
      rawRepo.find.mockResolvedValue([buildSpotEntity()]);

      const result = await repository.findByCriteria({ spaceId: SPACE_ID });

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(PlantingSpotViewModel);
    });

    it('should return an empty array when no entities match', async () => {
      rawRepo.find.mockResolvedValue([]);

      const result = await repository.findByCriteria({ spaceId: SPACE_ID });

      expect(result).toHaveLength(0);
    });

    it('should pass type filter when provided', async () => {
      const potEntity = buildSpotEntity({ type: PlantingSpotTypeEnum.POT });
      rawRepo.find.mockResolvedValue([potEntity]);

      const result = await repository.findByCriteria({
        spaceId: SPACE_ID,
        type: PlantingSpotTypeEnum.POT,
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(PlantingSpotTypeEnum.POT);
    });
  });
});
