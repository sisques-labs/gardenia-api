import { Criteria } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import { PlantSpeciesTypeOrmEntity } from '../entities/plant-species.entity';
import { PlantSpeciesTypeOrmMapper } from '../mappers/plant-species-typeorm.mapper';
import { PlantSpeciesTypeOrmWriteRepository } from './plant-species-typeorm-write.repository';

const SPECIES_ID = '550e8400-e29b-41d4-a716-446655440000';

const buildEntity = (
  overrides: Partial<PlantSpeciesTypeOrmEntity> = {},
): PlantSpeciesTypeOrmEntity => {
  const e = new PlantSpeciesTypeOrmEntity();
  e.id = SPECIES_ID;
  e.scientificName = 'Monstera deliciosa';
  e.gbifKey = 2882337;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

const buildAggregate = () =>
  new PlantSpeciesBuilder()
    .withId(SPECIES_ID)
    .withScientificName('Monstera deliciosa')
    .withGbifKey(2882337)
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('PlantSpeciesTypeOrmWriteRepository', () => {
  let repository: PlantSpeciesTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<PlantSpeciesTypeOrmEntity>>;
  let mapper: PlantSpeciesTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlantSpeciesTypeOrmEntity>>;

    mapper = new PlantSpeciesTypeOrmMapper(new PlantSpeciesBuilder());

    repository = new PlantSpeciesTypeOrmWriteRepository(rawRepo, mapper);
  });

  describe('save()', () => {
    it('persists the aggregate and returns domain object', async () => {
      rawRepo.save.mockResolvedValue(buildEntity());
      const aggregate = buildAggregate();

      const result = await repository.save(aggregate);

      expect(rawRepo.save).toHaveBeenCalledTimes(1);
      expect(result.toPrimitives().id).toBe(SPECIES_ID);
    });
  });

  describe('findById()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(SPECIES_ID);

      expect(result).not.toBeNull();
      expect(result!.toPrimitives().id).toBe(SPECIES_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByGbifKey()', () => {
    it('returns aggregate when a matching gbifKey exists', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findByGbifKey(2882337);

      expect(rawRepo.findOne).toHaveBeenCalledWith({
        where: { gbifKey: 2882337 },
      });
      expect(result!.toPrimitives().gbifKey).toBe(2882337);
    });

    it('returns null when no entity matches the gbifKey', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByGbifKey(1);

      expect(result).toBeNull();
    });
  });

  describe('findByCriteria()', () => {
    it('returns paginated aggregates ordered by scientificName by default', async () => {
      rawRepo.findAndCount.mockResolvedValue([[buildEntity()], 1]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(rawRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { scientificName: 'ASC' } }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].toPrimitives().id).toBe(SPECIES_ID);
      expect(result.total).toBe(1);
    });

    it('merges a client-supplied sort into the order object', async () => {
      rawRepo.findAndCount.mockResolvedValue([[], 0]);

      await repository.findByCriteria(
        new Criteria(
          [],
          [{ field: 'createdAt', direction: 'DESC' as any }],
          undefined,
        ),
      );

      expect(rawRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { scientificName: 'ASC', createdAt: 'DESC' },
        }),
      );
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(SPECIES_ID);

      expect(rawRepo.delete).toHaveBeenCalledWith(SPECIES_ID);
    });
  });
});
