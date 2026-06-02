import { Repository } from 'typeorm';

import { PlantingSpotBuilder } from '@contexts/planting-spots/domain/builders/planting-spot.builder';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotTypeOrmEntity } from '../entities/planting-spot.entity';
import { PlantingSpotTypeOrmMapper } from '../mappers/planting-spot-typeorm.mapper';
import { PlantingSpotTypeOrmWriteRepository } from './planting-spot-typeorm-write.repository';

const SPOT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';

const buildSpotAggregate = () =>
  new PlantingSpotBuilder()
    .withId(SPOT_ID)
    .withName('Bancal Norte')
    .withType(PlantingSpotTypeEnum.RAISED_BED)
    .withDescription(null)
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

const buildSpotEntity = (): PlantingSpotTypeOrmEntity => {
  const e = new PlantingSpotTypeOrmEntity();
  e.id = SPOT_ID;
  e.name = 'Bancal Norte';
  e.type = PlantingSpotTypeEnum.RAISED_BED;
  e.description = null;
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2024-01-01');
  e.updatedAt = new Date('2024-01-01');
  return e;
};

describe('PlantingSpotTypeOrmWriteRepository', () => {
  let repository: PlantingSpotTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<PlantingSpotTypeOrmEntity>>;
  let mapper: PlantingSpotTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlantingSpotTypeOrmEntity>>;

    mapper = new PlantingSpotTypeOrmMapper(new PlantingSpotBuilder());

    // SpaceContext mock — createTenantRepository calls ctx.require() per operation
    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new PlantingSpotTypeOrmWriteRepository(
      mapper,
      rawRepo,
      spaceContext,
    );
  });

  describe('save()', () => {
    it('should persist the aggregate via the raw repository', async () => {
      rawRepo.save.mockResolvedValue(buildSpotEntity());
      const aggregate = buildSpotAggregate();

      await repository.save(aggregate);

      expect(rawRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById()', () => {
    it('should return an aggregate when the entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildSpotEntity());

      const result = await repository.findById(SPOT_ID, SPACE_ID);

      expect(result).not.toBeNull();
      expect(result?.toPrimitives().id).toBe(SPOT_ID);
    });

    it('should return null when the entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent', SPACE_ID);

      expect(result).toBeNull();
    });
  });

  describe('delete()', () => {
    it('should call delete on the raw repository with the spot id', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(SPOT_ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
