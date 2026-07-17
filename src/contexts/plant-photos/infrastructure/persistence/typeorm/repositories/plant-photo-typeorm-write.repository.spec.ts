import { Criteria } from '@sisques-labs/nestjs-kit';
import { Repository } from 'typeorm';

import { PlantPhotoBuilder } from '@contexts/plant-photos/domain/builders/plant-photo.builder';
import { PlantPhotoTypeOrmEntity } from '../entities/plant-photo.entity';
import { PlantPhotoTypeOrmMapper } from '../mappers/plant-photo-typeorm.mapper';
import { PlantPhotoTypeOrmWriteRepository } from './plant-photo-typeorm-write.repository';

const PHOTO_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';
const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<PlantPhotoTypeOrmEntity> = {},
): PlantPhotoTypeOrmEntity => {
  const e = new PlantPhotoTypeOrmEntity();
  e.id = PHOTO_ID;
  e.plantId = PLANT_ID;
  e.fileId = FILE_ID;
  e.url = '/api/files/330e8400/content';
  e.userId = USER_ID;
  e.spaceId = SPACE_ID;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

const buildAggregate = () =>
  new PlantPhotoBuilder()
    .withId(PHOTO_ID)
    .withPlantId(PLANT_ID)
    .withFileId(FILE_ID)
    .withUrl('/api/files/330e8400/content')
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('PlantPhotoTypeOrmWriteRepository', () => {
  let repository: PlantPhotoTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<PlantPhotoTypeOrmEntity>>;
  let mapper: PlantPhotoTypeOrmMapper;

  beforeEach(() => {
    rawRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<PlantPhotoTypeOrmEntity>>;

    mapper = new PlantPhotoTypeOrmMapper(new PlantPhotoBuilder());

    const spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as any;

    repository = new PlantPhotoTypeOrmWriteRepository(
      mapper,
      rawRepo,
      spaceContext,
    );
  });

  describe('save()', () => {
    it('persists the aggregate and returns domain object', async () => {
      rawRepo.save.mockResolvedValue(buildEntity());
      const aggregate = buildAggregate();

      const result = await repository.save(aggregate);

      expect(rawRepo.save).toHaveBeenCalledTimes(1);
      expect(result.toPrimitives().id).toBe(PHOTO_ID);
    });
  });

  describe('findById()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(PHOTO_ID);

      expect(result).not.toBeNull();
      expect(result!.toPrimitives().id).toBe(PHOTO_ID);
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

      await repository.delete(PHOTO_ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
