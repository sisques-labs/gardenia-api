import { Criteria } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import { PlantTypeOrmEntity } from '../entities/plant.entity';
import { PlantTypeOrmMapper } from '../mappers/plant-typeorm.mapper';
import { PlantTypeOrmWriteRepository } from './plant-typeorm-write.repository';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPECIES_ID = '880e8400-e29b-41d4-a716-446655440003';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const QR_ID = '990e8400-e29b-41d4-a716-446655440004';
const SPOT_ID = 'aa0e8400-e29b-41d4-a716-446655440005';

const buildEntity = (
  overrides: Partial<PlantTypeOrmEntity> = {},
): PlantTypeOrmEntity => {
  const e = new PlantTypeOrmEntity();
  e.id = PLANT_ID;
  e.name = 'Aloe';
  e.plantSpeciesId = SPECIES_ID;
  e.imageUrl = 'https://example.com/aloe.png';
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.qrId = QR_ID;
  e.plantingSpotId = SPOT_ID;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

const buildAggregate = () =>
  new PlantBuilder()
    .withId(PLANT_ID)
    .withName('Aloe')
    .withPlantSpeciesId(SPECIES_ID)
    .withImageUrl('https://example.com/aloe.png')
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withQrId(QR_ID)
    .withPlantingSpotId(SPOT_ID)
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('PlantTypeOrmWriteRepository', () => {
  let repository: PlantTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<PlantTypeOrmEntity>>;
  let mapper: PlantTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlantTypeOrmEntity>>;

    mapper = new PlantTypeOrmMapper(new PlantBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new PlantTypeOrmWriteRepository(mapper, rawRepo, spaceContext);
  });

  describe('save()', () => {
    it('persists the aggregate and returns domain object', async () => {
      rawRepo.save.mockResolvedValue(buildEntity());
      const aggregate = buildAggregate();

      const result = await repository.save(aggregate);

      expect(rawRepo.save).toHaveBeenCalledTimes(1);
      expect(result.toPrimitives().id).toBe(PLANT_ID);
    });
  });

  describe('findById()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(PLANT_ID);

      expect(result).not.toBeNull();
      expect(result!.toPrimitives().id).toBe(PLANT_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('throws not implemented', async () => {
      await expect(
        repository.findByCriteria(
          new Criteria(undefined, undefined, undefined),
        ),
      ).rejects.toThrow('Method not implemented.');
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(PLANT_ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
